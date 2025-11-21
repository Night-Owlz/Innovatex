<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ChatSession;
use App\Models\ConsumptionLog;
use App\Models\Inventory;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class ChatbotController extends Controller
{
    /**
     * Maximum messages to keep in session history
     */
    private const MAX_MESSAGES = 20;

    /**
     * OpenRouter API timeout in seconds
     */
    private const API_TIMEOUT = 30;

    /**
     * Send message to chatbot and get response
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function sendMessage(Request $request): JsonResponse
    {
        try {
            // Validate request
            $validated = $request->validate([
                'sessionId' => 'nullable|string|uuid',
                'message' => 'required|string|max:1000',
            ]);

            $user = $request->user();
            $userMessage = $validated['message'];
            $sessionId = $validated['sessionId'] ?? null;

            // Get or create chat session
            $session = $this->getOrCreateSession($user->id, $sessionId);

            // Build context from user data
            $context = $this->buildUserContext($user);

            // Build system prompt
            $systemPrompt = $this->buildSystemPrompt($context);

            // Get conversation history
            $messages = $session->messages ?? [];

            // Build messages array for API
            $apiMessages = $this->buildApiMessages($systemPrompt, $messages, $userMessage);

            // Call OpenRouter API
            $botReply = $this->callOpenRouterAPI($apiMessages);

            // Add user message and bot reply to session
            $messages[] = [
                'role' => 'user',
                'content' => $userMessage,
                'timestamp' => Carbon::now()->toIso8601String(),
            ];

            $messages[] = [
                'role' => 'assistant',
                'content' => $botReply,
                'timestamp' => Carbon::now()->toIso8601String(),
            ];

            // Keep only last MAX_MESSAGES messages
            if (count($messages) > self::MAX_MESSAGES) {
                $messages = array_slice($messages, -self::MAX_MESSAGES);
            }

            // Update session
            $session->messages = $messages;
            $session->save();

            return response()->json([
                'reply' => $botReply,
                'sessionId' => $session->session_id,
                'timestamp' => Carbon::now()->toIso8601String(),
            ], 200);

        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);

        } catch (\Exception $e) {
            Log::error('Chatbot Error: ' . $e->getMessage(), [
                'user_id' => $request->user()->id ?? null,
                'session_id' => $sessionId ?? null,
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'message' => 'Bot is temporarily unavailable, please try again',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Get all chat sessions for user
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function getSessions(Request $request): JsonResponse
    {
        try {
            $user = $request->user();

            $sessions = ChatSession::where('user_id', $user->id)
                ->orderBy('updated_at', 'desc')
                ->get()
                ->map(function ($session) {
                    $messages = $session->messages ?? [];
                    $lastMessage = !empty($messages) ? end($messages) : null;

                    return [
                        'sessionId' => $session->session_id,
                        'createdAt' => $session->created_at->toIso8601String(),
                        'updatedAt' => $session->updated_at->toIso8601String(),
                        'messageCount' => count($messages),
                        'lastMessage' => $lastMessage ? [
                            'role' => $lastMessage['role'],
                            'content' => Str::limit($lastMessage['content'], 100),
                            'timestamp' => $lastMessage['timestamp'] ?? null,
                        ] : null,
                    ];
                });

            return response()->json([
                'sessions' => $sessions,
                'total' => $sessions->count(),
            ], 200);

        } catch (\Exception $e) {
            Log::error('Get Sessions Error: ' . $e->getMessage(), [
                'user_id' => $request->user()->id ?? null,
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'message' => 'Failed to retrieve chat sessions',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Delete a chat session
     *
     * @param Request $request
     * @param string $sessionId
     * @return JsonResponse
     */
    public function deleteSession(Request $request, string $sessionId): JsonResponse
    {
        try {
            $user = $request->user();

            $session = ChatSession::where('session_id', $sessionId)
                ->where('user_id', $user->id)
                ->first();

            if (!$session) {
                return response()->json([
                    'message' => 'Session not found',
                ], 404);
            }

            $session->delete();

            return response()->json([
                'message' => 'Session deleted successfully',
                'sessionId' => $sessionId,
            ], 200);

        } catch (\Exception $e) {
            Log::error('Delete Session Error: ' . $e->getMessage(), [
                'user_id' => $request->user()->id ?? null,
                'session_id' => $sessionId,
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'message' => 'Failed to delete session',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Get or create chat session
     *
     * @param int $userId
     * @param string|null $sessionId
     * @return ChatSession
     */
    private function getOrCreateSession(int $userId, ?string $sessionId): ChatSession
    {
        if ($sessionId) {
            $session = ChatSession::where('session_id', $sessionId)
                ->where('user_id', $userId)
                ->first();

            if ($session) {
                return $session;
            }
        }

        // Create new session
        return ChatSession::create([
            'user_id' => $userId,
            'session_id' => (string) Str::uuid(),
            'messages' => [],
        ]);
    }

    /**
     * Build user context from their data
     *
     * @param \App\Models\User $user
     * @return array
     */
    private function buildUserContext($user): array
    {
        // Get top 10 inventory items
        $inventoryItems = Inventory::where('user_id', $user->id)
            ->orderBy('expiration_date', 'asc')
            ->limit(10)
            ->get()
            ->map(function ($item) {
                $expiryInfo = '';
                if ($item->expiration_date) {
                    $daysUntil = Carbon::now()->diffInDays($item->expiration_date, false);
                    if ($daysUntil < 0) {
                        $expiryInfo = ' (expired)';
                    } elseif ($daysUntil <= 3) {
                        $expiryInfo = ' (expires in ' . abs($daysUntil) . ' days)';
                    }
                }
                return $item->item_name . ' (' . $item->quantity . ' ' . $item->unit . ')' . $expiryInfo;
            })
            ->toArray();

        // Get last 5 consumption logs
        $recentLogs = ConsumptionLog::where('user_id', $user->id)
            ->orderBy('consumption_date', 'desc')
            ->limit(5)
            ->get()
            ->map(function ($log) {
                return $log->item_name . ' (' . $log->category . ')';
            })
            ->toArray();

        // Get dietary preferences
        $preferences = $user->dietary_preferences ?? [];
        if (!is_array($preferences)) {
            $preferences = [];
        }

        return [
            'inventory_items' => $inventoryItems,
            'recent_logs' => $recentLogs,
            'preferences' => $preferences,
            'household_size' => $user->household_size ?? 1,
        ];
    }

    /**
     * Build system prompt with user context
     *
     * @param array $context
     * @return string
     */
    private function buildSystemPrompt(array $context): string
    {
        $inventoryText = !empty($context['inventory_items']) 
            ? implode(', ', $context['inventory_items'])
            : 'No items currently in inventory';

        $recentLogsText = !empty($context['recent_logs'])
            ? implode(', ', $context['recent_logs'])
            : 'No recent consumption logged';

        $preferencesText = !empty($context['preferences'])
            ? implode(', ', $context['preferences'])
            : 'None specified';

        $householdText = $context['household_size'] > 1 
            ? "The user has a household size of {$context['household_size']} people."
            : "The user lives alone.";

        return "You are NourishBot, an AI assistant helping users reduce food waste and improve nutrition. " .
               "{$householdText} " .
               "The user currently has: {$inventoryText}. " .
               "Recently consumed: {$recentLogsText}. " .
               "Dietary preferences: {$preferencesText}. " .
               "Provide practical, concise advice in 2-3 sentences. Be friendly and action-oriented. " .
               "Focus on reducing food waste, suggesting recipes using available ingredients, " .
               "and promoting balanced nutrition.";
    }

    /**
     * Build messages array for API call
     *
     * @param string $systemPrompt
     * @param array $conversationHistory
     * @param string $userMessage
     * @return array
     */
    private function buildApiMessages(string $systemPrompt, array $conversationHistory, string $userMessage): array
    {
        $messages = [
            [
                'role' => 'system',
                'content' => $systemPrompt,
            ],
        ];

        // Add conversation history (exclude system messages from history)
        foreach ($conversationHistory as $msg) {
            if (isset($msg['role']) && isset($msg['content']) && $msg['role'] !== 'system') {
                $messages[] = [
                    'role' => $msg['role'],
                    'content' => $msg['content'],
                ];
            }
        }

        // Add current user message
        $messages[] = [
            'role' => 'user',
            'content' => $userMessage,
        ];

        return $messages;
    }

    /**
     * Call OpenRouter API to get bot response
     *
     * @param array $messages
     * @return string
     * @throws \Exception
     */
    private function callOpenRouterAPI(array $messages): string
    {
        $apiKey = config('services.openrouter.api_key');
        $siteUrl = config('services.openrouter.site_url', config('app.url'));
        $siteName = config('services.openrouter.site_name', config('app.name'));

        if (!$apiKey) {
            throw new \Exception('OpenRouter API key not configured');
        }

        try {
            $response = Http::timeout(self::API_TIMEOUT)
                ->withHeaders([
                    'Authorization' => 'Bearer ' . $apiKey,
                    'Content-Type' => 'application/json',
                    'HTTP-Referer' => $siteUrl,
                    'X-Title' => $siteName,
                ])
                ->post('https://openrouter.ai/api/v1/chat/completions', [
                    'model' => 'meta-llama/llama-3.2-3b-instruct:free',
                    'messages' => $messages,
                ]);

            if (!$response->successful()) {
                Log::error('OpenRouter API Error', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);
                throw new \Exception('OpenRouter API returned error: ' . $response->status());
            }

            $data = $response->json();

            if (!isset($data['choices'][0]['message']['content'])) {
                throw new \Exception('Invalid response format from OpenRouter API');
            }

            return $data['choices'][0]['message']['content'];

        } catch (\Illuminate\Http\Client\ConnectionException $e) {
            Log::error('OpenRouter API Connection Error: ' . $e->getMessage());
            throw new \Exception('Failed to connect to AI service');

        } catch (\Illuminate\Http\Client\RequestException $e) {
            Log::error('OpenRouter API Request Error: ' . $e->getMessage());
            throw new \Exception('AI service request failed');
        }
    }
}
