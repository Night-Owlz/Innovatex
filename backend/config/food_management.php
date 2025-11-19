<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Pagination Settings
    |--------------------------------------------------------------------------
    */
    'pagination' => [
        'default' => env('PAGINATION_DEFAULT', 15),
        'max' => env('PAGINATION_MAX', 100),
    ],

    /*
    |--------------------------------------------------------------------------
    | Inventory Settings
    |--------------------------------------------------------------------------
    */
    'inventory' => [
        'expiring_soon_days' => env('INVENTORY_EXPIRING_DAYS', 7),
        'critical_expiration_days' => env('INVENTORY_CRITICAL_DAYS', 3),
        'low_stock_threshold' => env('INVENTORY_LOW_STOCK', 1.0),
    ],

    /*
    |--------------------------------------------------------------------------
    | Consumption Log Settings
    |--------------------------------------------------------------------------
    */
    'consumption' => [
        'recent_days' => env('CONSUMPTION_RECENT_DAYS', 7),
        'activity_period_days' => env('CONSUMPTION_ACTIVITY_PERIOD', 30),
    ],

    /*
    |--------------------------------------------------------------------------
    | Recommendation Settings
    |--------------------------------------------------------------------------
    */
    'recommendations' => [
        'max_recommendations' => env('RECOMMENDATIONS_MAX', 5),
        'category_limit' => env('RECOMMENDATIONS_CATEGORY_LIMIT', 1),
        'waste_reduction_limit' => env('RECOMMENDATIONS_WASTE_LIMIT', 2),
    ],

    /*
    |--------------------------------------------------------------------------
    | Cache Settings
    |--------------------------------------------------------------------------
    */
    'cache' => [
        'food_items_ttl' => env('CACHE_FOOD_ITEMS_TTL', 3600), // 1 hour
        'resources_ttl' => env('CACHE_RESOURCES_TTL', 1800), // 30 minutes
        'dashboard_ttl' => env('CACHE_DASHBOARD_TTL', 300), // 5 minutes
    ],

    /*
    |--------------------------------------------------------------------------
    | File Upload Settings
    |--------------------------------------------------------------------------
    */
    'uploads' => [
        'max_size' => env('UPLOAD_MAX_SIZE', 5120), // KB
        'allowed_extensions' => ['jpg', 'jpeg', 'png', 'gif'],
        'storage_path' => 'uploads/images',
    ],

];
