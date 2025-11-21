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
        Schema::create('impact_scores', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->date('score_date');
            $table->decimal('overall_score', 5, 2)->default(0.00);
            $table->decimal('waste_reduction_score', 5, 2)->default(0.00);
            $table->decimal('nutrition_balance_score', 5, 2)->default(0.00);
            $table->decimal('inventory_utilization_score', 5, 2)->default(0.00);
            $table->decimal('sustainable_practices_score', 5, 2)->default(0.00);
            $table->text('insights')->nullable();
            $table->json('action_steps')->nullable();
            $table->timestamps();

            // Add index for faster queries
            $table->index(['user_id', 'score_date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('impact_scores');
    }
};
