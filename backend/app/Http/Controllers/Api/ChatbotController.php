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
     * Model priority list - will try models in order until one succeeds
     */
    private const MODEL_PRIORITY = [
        'x-ai/grok-4.1-fast',
        'x-ai/grok-4.1-fast:free',
        'nvidia/nemotron-nano-12b-v2-vl:free',
        'mistralai/mistral-small-3.2-24b-instruct:free',
        'qwen/qwen2.5-vl-32b-instruct:free',
        'mistralai/mistral-small-3.1-24b-instruct:free',
        'google/gemma-3-4b-it:free',
        'google/gemma-3-12b-it:free',
        'google/gemma-3-27b-it:free',
        'google/gemini-2.0-flash-exp:free',
    ];

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

            // Call OpenRouter API with fallback
            $result = $this->callOpenRouterAPI($apiMessages);
            $botReply = $result['reply'];
            $modelUsed = $result['model'];

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
                'model' => $modelUsed,
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

        $knowledgeBase = $this->getKnowledgeBase();

        return "You are NourishBot, a multi-capability AI food assistant specializing in:\n" .
               "1. Food Waste Reduction - Help users minimize waste through smart storage and planning\n" .
               "2. Nutrition Balancing - Provide balanced meal suggestions and nutritional guidance\n" .
               "3. Budget Meal Planning - Suggest affordable, cost-effective meal options\n" .
               "4. Creative Leftover Transformation - Turn leftovers into exciting new meals\n" .
               "5. Local Food Sharing - Guide users on community food sharing programs\n" .
               "6. Environmental Impact Education - Explain how food choices affect the environment\n\n" .
               "USER CONTEXT:\n" .
               "{$householdText}\n" .
               "Current Inventory: {$inventoryText}\n" .
               "Recently Consumed: {$recentLogsText}\n" .
               "Dietary Preferences: {$preferencesText}\n\n" .
               "KNOWLEDGE BASE:\n{$knowledgeBase}\n\n" .
               "GUIDELINES:\n" .
               "- Provide practical, actionable advice\n" .
               "- Use the user's inventory to suggest recipes when possible\n" .
               "- Prioritize items that are expiring soon\n" .
               "- Be friendly, encouraging, and eco-conscious\n" .
               "- Keep responses concise but informative (2-4 sentences unless asked for detailed info)\n" .
               "- Use emojis sparingly to make responses engaging";
    }

    /**
     * Get knowledge base with tips and guidelines
     *
     * @return string
     */
    private function getKnowledgeBase(): string
    {
        return "FOOD WASTE REDUCTION TIPS:\n" .
               "- Store leafy greens in airtight containers with paper towels to extend freshness\n" .
               "- Freeze herbs in olive oil ice cube trays for later use\n" .
               "- Use FIFO (First In, First Out) method - place newer items behind older ones\n" .
               "- Bread going stale? Make croutons, breadcrumbs, or French toast\n" .
               "- Brown bananas are perfect for banana bread or smoothies\n" .
               "- Vegetable scraps (peels, ends) can be saved for making stock\n" .
               "- Wilted vegetables can often be revived in ice water\n\n" .
               "NUTRITION BALANCING:\n" .
               "- Aim for a color variety in each meal (different colored vegetables = different nutrients)\n" .
               "- Balanced plate: 1/2 vegetables, 1/4 protein, 1/4 whole grains\n" .
               "- Protein sources: meat, fish, eggs, beans, lentils, tofu, nuts\n" .
               "- Don't skip healthy fats: olive oil, avocados, nuts, seeds\n" .
               "- Fiber-rich foods help with satiety and digestion\n" .
               "- Stay hydrated - aim for 8 glasses of water daily\n\n" .
               "BUDGET MEAL PLANNING:\n" .
               "- Beans and lentils are affordable protein sources\n" .
               "- Buy seasonal produce - it's cheaper and fresher\n" .
               "- Plan meals around sale items and bulk purchases\n" .
               "- Rice, pasta, and potatoes are budget-friendly staples\n" .
               "- Batch cooking saves time and money\n" .
               "- Frozen vegetables are nutritious and economical\n" .
               "- Store brands often match quality at lower prices\n\n" .
               "LEFTOVER TRANSFORMATION IDEAS:\n" .
               "- Roasted vegetables → vegetable soup or frittata\n" .
               "- Rice → fried rice, rice pudding, stuffed peppers\n" .
               "- Rotisserie chicken → chicken salad, tacos, soup, pot pie\n" .
               "- Pasta → pasta bake, pasta salad\n" .
               "- Mashed potatoes → potato pancakes, shepherd's pie topping\n" .
               "- Bread → bread pudding, panzanella salad, croutons\n\n" .
               "LOCAL FOOD SHARING:\n" .
               "- Look for food banks and community fridges in your area\n" .
               "- Apps like Olio, Too Good To Go connect people with surplus food\n" .
               "- Community gardens often share excess produce\n" .
               "- Meal sharing programs connect home cooks with neighbors\n" .
               "- Food rescue organizations pick up surplus from restaurants/stores\n" .
               "- Join or start a neighborhood food swap\n\n" .
               "ENVIRONMENTAL IMPACT FACTS:\n" .
               "- Food waste generates 8-10% of global greenhouse gas emissions\n" .
               "- Animal agriculture uses 77% of agricultural land but provides only 18% of calories\n" .
               "- Eating local, seasonal produce reduces carbon footprint from transportation\n" .
               "- Plant-based meals generally have lower environmental impact\n" .
               "- Food waste in landfills produces methane, a potent greenhouse gas\n" .
               "- Composting food scraps reduces waste and creates nutrient-rich soil\n" .
               "- Reducing meat consumption by 50% can cut diet-related emissions by 35%";
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
     * Call OpenRouter API to get bot response with automatic model fallback
     *
     * @param array $messages
     * @return array ['reply' => string, 'model' => string]
     * @throws \Exception
     */
    private function callOpenRouterAPI(array $messages): array
    {
        $apiKey = config('services.openrouter.api_key');
        $siteUrl = config('services.openrouter.site_url', config('app.url'));
        $siteName = config('services.openrouter.site_name', config('app.name'));

        if (!$apiKey) {
            throw new \Exception('OpenRouter API key not configured');
        }

        $lastError = null;
        
        // Try each model in priority order
        foreach (self::MODEL_PRIORITY as $model) {
            try {
                Log::info('Attempting to use model: ' . $model);
                
                $response = Http::timeout(self::API_TIMEOUT)
                    ->withHeaders([
                        'Authorization' => 'Bearer ' . $apiKey,
                        'Content-Type' => 'application/json',
                        'HTTP-Referer' => $siteUrl,
                        'X-Title' => $siteName,
                    ])
                    ->post('https://openrouter.ai/api/v1/chat/completions', [
                        'model' => $model,
                        'messages' => $messages,
                        'temperature' => 0.7,
                        'max_tokens' => 500,
                    ]);

                if ($response->successful()) {
                    $data = $response->json();

                    if (isset($data['choices'][0]['message']['content'])) {
                        Log::info('Successfully used model: ' . $model);
                        return [
                            'reply' => $data['choices'][0]['message']['content'],
                            'model' => $model,
                        ];
                    }
                }
                
                // Log the error and try next model
                $lastError = 'Model ' . $model . ' returned invalid response';
                Log::warning($lastError, [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);
                
            } catch (\Illuminate\Http\Client\ConnectionException $e) {
                $lastError = 'Connection failed for model ' . $model;
                Log::warning($lastError . ': ' . $e->getMessage());
                continue;
                
            } catch (\Illuminate\Http\Client\RequestException $e) {
                $lastError = 'Request failed for model ' . $model;
                Log::warning($lastError . ': ' . $e->getMessage());
                continue;
                
            } catch (\Exception $e) {
                $lastError = 'Error with model ' . $model;
                Log::warning($lastError . ': ' . $e->getMessage());
                continue;
            }
        }
        
        // All models failed
        Log::error('All AI models failed', ['last_error' => $lastError]);
        throw new \Exception('All AI models are currently unavailable. Please try again later.');
    }
}
