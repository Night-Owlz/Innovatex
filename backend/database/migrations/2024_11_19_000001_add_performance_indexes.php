<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Add indexes to users table
        Schema::table('users', function (Blueprint $table) {
            $table->index('email');
            $table->index('budget_range');
            $table->index('created_at');
        });

        // Add indexes to inventories table
        Schema::table('inventories', function (Blueprint $table) {
            $table->index('user_id');
            $table->index('food_item_id');
            $table->index('category');
            $table->index('expiration_date');
            $table->index('purchase_date');
            $table->index(['user_id', 'category']);
            $table->index(['user_id', 'expiration_date']);
            $table->index('created_at');
        });

        // Add indexes to consumption_logs table
        Schema::table('consumption_logs', function (Blueprint $table) {
            $table->index('user_id');
            $table->index('category');
            $table->index('consumption_date');
            $table->index(['user_id', 'category']);
            $table->index(['user_id', 'consumption_date']);
            $table->index('created_at');
        });

        // Add indexes to food_items table
        Schema::table('food_items', function (Blueprint $table) {
            $table->index('category');
            $table->index('name');
            $table->index('created_at');
        });

        // Add indexes to resources table
        Schema::table('resources', function (Blueprint $table) {
            $table->index('category');
            $table->index('created_at');
        });

        // Add indexes to image_uploads table
        Schema::table('image_uploads', function (Blueprint $table) {
            $table->index('user_id');
            $table->index('related_inventory_id');
            $table->index('related_log_id');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['email']);
            $table->dropIndex(['budget_range']);
            $table->dropIndex(['created_at']);
        });

        Schema::table('inventories', function (Blueprint $table) {
            $table->dropIndex(['user_id']);
            $table->dropIndex(['food_item_id']);
            $table->dropIndex(['category']);
            $table->dropIndex(['expiration_date']);
            $table->dropIndex(['purchase_date']);
            $table->dropIndex(['user_id', 'category']);
            $table->dropIndex(['user_id', 'expiration_date']);
            $table->dropIndex(['created_at']);
        });

        Schema::table('consumption_logs', function (Blueprint $table) {
            $table->dropIndex(['user_id']);
            $table->dropIndex(['category']);
            $table->dropIndex(['consumption_date']);
            $table->dropIndex(['user_id', 'category']);
            $table->dropIndex(['user_id', 'consumption_date']);
            $table->dropIndex(['created_at']);
        });

        Schema::table('food_items', function (Blueprint $table) {
            $table->dropIndex(['category']);
            $table->dropIndex(['name']);
            $table->dropIndex(['created_at']);
        });

        Schema::table('resources', function (Blueprint $table) {
            $table->dropIndex(['category']);
            $table->dropIndex(['created_at']);
        });

        Schema::table('image_uploads', function (Blueprint $table) {
            $table->dropIndex(['user_id']);
            $table->dropIndex(['related_inventory_id']);
            $table->dropIndex(['related_log_id']);
            $table->dropIndex(['created_at']);
        });
    }
};
