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
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('name');
            $table->string('full_name')->after('id');
            $table->integer('household_size')->default(1)->after('password');
            $table->json('dietary_preferences')->nullable()->after('household_size');
            $table->string('budget_range', 50)->nullable()->after('dietary_preferences');
            $table->string('location')->nullable()->after('budget_range');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['full_name', 'household_size', 'dietary_preferences', 'budget_range', 'location']);
            $table->string('name')->after('id');
        });
    }
};
