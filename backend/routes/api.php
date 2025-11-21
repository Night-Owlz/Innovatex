<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\ConsumptionLogController;
use App\Http\Controllers\Api\InventoryController;
use App\Http\Controllers\Api\FoodItemController;
use App\Http\Controllers\Api\ResourceController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\ImageUploadController;
use App\Http\Controllers\Api\AIAnalysisController;
use App\Http\Controllers\Api\OCRController;
use App\Http\Controllers\Api\MealPlannerController;
use App\Http\Controllers\Api\ChatbotController;
use App\Http\Controllers\Api\ImpactScoreController;
use App\Http\Controllers\Api\WasteController;
use App\Http\Controllers\Api\ExpirationController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes - Version 1
|--------------------------------------------------------------------------
*/

Route::prefix('v1')->name('v1.')->group(function () {
    
    // Public Authentication Routes
    Route::prefix('auth')->name('auth.')->group(function () {
        Route::post('register', [AuthController::class, 'register'])->name('register');
        Route::post('login', [AuthController::class, 'login'])->name('login');
    });

    // Public Food Items & Resources
    Route::apiResource('food-items', FoodItemController::class)->only(['index', 'show']);
    Route::apiResource('resources', ResourceController::class)->only(['index', 'show']);

    // Protected Routes (Requires Authentication)
    Route::middleware(['auth:sanctum', 'throttle:60,1'])->group(function () {
        
        // Authentication
        Route::post('auth/logout', [AuthController::class, 'logout'])->name('auth.logout');
        
        // User Profile
        Route::prefix('profile')->name('profile.')->group(function () {
            Route::get('/', [ProfileController::class, 'show'])->name('show');
            Route::put('/', [ProfileController::class, 'update'])->name('update');
            Route::post('/', [ProfileController::class, 'update'])->name('update.post'); // For FormData with _method
        });
        
        // Consumption Logs
        Route::apiResource('consumption-logs', ConsumptionLogController::class)->except(['update']);
        
        // Inventory Management
        Route::apiResource('inventory', InventoryController::class);
        
        // Dashboard
        Route::prefix('dashboard')->name('dashboard.')->group(function () {
            Route::get('summary', [DashboardController::class, 'summary'])->name('summary');
            Route::get('recommendations', [DashboardController::class, 'recommendations'])->name('recommendations');
        });
        
        // Image Uploads
        Route::prefix('images')->name('images.')->group(function () {
            Route::post('upload', [ImageUploadController::class, 'upload'])->name('upload');
            Route::get('/', [ImageUploadController::class, 'index'])->name('index');
        });
        
        // AI Analysis
        Route::prefix('ai')->name('ai.')->group(function () {
            Route::post('analyze-patterns', [AIAnalysisController::class, 'analyzePatterns'])->name('analyze-patterns');
            Route::post('ocr-extract', [OCRController::class, 'extractFromImage'])->name('ocr-extract');
            Route::post('optimize-meal-plan', [MealPlannerController::class, 'optimizeMealPlan'])->name('optimize-meal-plan');
            Route::get('impact-score', [ImpactScoreController::class, 'calculateScore'])->name('impact-score');
            Route::get('waste-estimation', [WasteController::class, 'estimation'])->name('waste-estimation');
            Route::get('expiration-risks', [ExpirationController::class, 'getRisks'])->name('expiration-risks');
        });
        
        // Chatbot
        Route::prefix('chatbot')->name('chatbot.')->group(function () {
            Route::post('message', [ChatbotController::class, 'sendMessage'])->name('message');
            Route::get('sessions', [ChatbotController::class, 'getSessions'])->name('sessions');
            Route::delete('sessions/{sessionId}', [ChatbotController::class, 'deleteSession'])->name('delete-session');
        });
    });
});

/*
|--------------------------------------------------------------------------
| Legacy API Routes (Backward Compatibility)
|--------------------------------------------------------------------------
*/

// Public routes
Route::post('/register', [AuthController::class, 'register'])->name('legacy.register');
Route::post('/login', [AuthController::class, 'login'])->name('legacy.login');
Route::get('/food-items', [FoodItemController::class, 'index'])->name('legacy.food-items.index');
Route::get('/food-items/{id}', [FoodItemController::class, 'show'])->name('legacy.food-items.show');
Route::get('/resources', [ResourceController::class, 'index'])->name('legacy.resources.index');
Route::get('/resources/{id}', [ResourceController::class, 'show'])->name('legacy.resources.show');

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout'])->name('legacy.logout');
    Route::get('/profile', [ProfileController::class, 'show'])->name('legacy.profile.show');
    Route::put('/profile', [ProfileController::class, 'update'])->name('legacy.profile.update');
    
    // Consumption Logs - Manual routes to avoid naming conflicts
    Route::get('/consumption-logs', [ConsumptionLogController::class, 'index'])->name('legacy.consumption-logs.index');
    Route::post('/consumption-logs', [ConsumptionLogController::class, 'store'])->name('legacy.consumption-logs.store');
    Route::get('/consumption-logs/{id}', [ConsumptionLogController::class, 'show'])->name('legacy.consumption-logs.show');
    Route::delete('/consumption-logs/{id}', [ConsumptionLogController::class, 'destroy'])->name('legacy.consumption-logs.destroy');
    
    // Inventory - Manual routes to avoid naming conflicts
    Route::get('/inventory', [InventoryController::class, 'index'])->name('legacy.inventory.index');
    Route::post('/inventory', [InventoryController::class, 'store'])->name('legacy.inventory.store');
    Route::get('/inventory/{id}', [InventoryController::class, 'show'])->name('legacy.inventory.show');
    Route::put('/inventory/{id}', [InventoryController::class, 'update'])->name('legacy.inventory.update');
    Route::delete('/inventory/{id}', [InventoryController::class, 'destroy'])->name('legacy.inventory.destroy');
    
    Route::get('/dashboard/summary', [DashboardController::class, 'summary'])->name('legacy.dashboard.summary');
    Route::get('/recommendations', [DashboardController::class, 'recommendations'])->name('legacy.recommendations');
    Route::post('/images/upload', [ImageUploadController::class, 'upload'])->name('legacy.images.upload');
    Route::get('/images', [ImageUploadController::class, 'index'])->name('legacy.images.index');
});

