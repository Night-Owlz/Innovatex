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
        Schema::create('waste_predictions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->date('prediction_date');
            $table->decimal('weekly_waste_grams', 10, 2)->default(0.00);
            $table->decimal('weekly_waste_cost', 10, 2)->default(0.00);
            $table->decimal('monthly_waste_grams', 10, 2)->default(0.00);
            $table->decimal('monthly_waste_cost', 10, 2)->default(0.00);
            $table->decimal('projected_yearly_grams', 10, 2)->default(0.00);
            $table->decimal('projected_yearly_cost', 10, 2)->default(0.00);
            $table->timestamps();

            // Add index for faster queries
            $table->index(['user_id', 'prediction_date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('waste_predictions');
    }
};
