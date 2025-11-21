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
        Schema::create('consumption_patterns', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->date('analysis_date');
            $table->json('weekly_trends')->nullable();
            $table->json('over_consumption')->nullable();
            $table->json('under_consumption')->nullable();
            $table->json('waste_risk_items')->nullable();
            $table->timestamps();

            // Add index for faster queries
            $table->index(['user_id', 'analysis_date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('consumption_patterns');
    }
};
