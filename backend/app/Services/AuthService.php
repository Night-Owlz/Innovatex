<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthService
{
    /**
     * Register a new user
     *
     * @param array $data
     * @return array
     */
    public function register(array $data): array
    {
        $user = User::create([
            'full_name' => $data['full_name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'household_size' => $data['household_size'] ?? 1,
            'dietary_preferences' => $data['dietary_preferences'] ?? null,
            'budget_range' => $data['budget_range'] ?? null,
            'location' => $data['location'] ?? null,
        ]);

        $token = $this->createTokenForUser($user);

        return [
            'user' => $user,
            'token' => $token,
        ];
    }

    /**
     * Authenticate user and return token
     *
     * @param string $email
     * @param string $password
     * @return array
     * @throws ValidationException
     */
    public function login(string $email, string $password): array
    {
        $user = User::where('email', $email)->first();

        if (!$user || !Hash::check($password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        $token = $this->createTokenForUser($user);

        return [
            'user' => $user,
            'token' => $token,
        ];
    }

    /**
     * Revoke user's current token
     *
     * @param User $user
     * @return void
     */
    public function logout(User $user): void
    {
        $user->currentAccessToken()->delete();
    }

    /**
     * Revoke all user's tokens
     *
     * @param User $user
     * @return void
     */
    public function logoutAllDevices(User $user): void
    {
        $user->tokens()->delete();
    }

    /**
     * Create authentication token for user
     *
     * @param User $user
     * @return string
     */
    private function createTokenForUser(User $user): string
    {
        return $user->createToken('auth-token')->plainTextToken;
    }
}
