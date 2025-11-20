<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Services\AuthService;
use App\Services\ConsumptionLogService;
use App\Services\DashboardService;
use App\Services\InventoryService;
use App\Services\RecommendationService;

class ServiceLayerServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        $this->app->singleton(AuthService::class, function ($app) {
            return new AuthService();
        });

        $this->app->singleton(InventoryService::class, function ($app) {
            return new InventoryService();
        });

        $this->app->singleton(ConsumptionLogService::class, function ($app) {
            return new ConsumptionLogService();
        });

        $this->app->singleton(RecommendationService::class, function ($app) {
            return new RecommendationService();
        });

        $this->app->singleton(DashboardService::class, function ($app) {
            return new DashboardService(
                $app->make(InventoryService::class),
                $app->make(ConsumptionLogService::class),
                $app->make(RecommendationService::class)
            );
        });
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        //
    }
}
