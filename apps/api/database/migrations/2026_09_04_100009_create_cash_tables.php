<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cash_entries', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('outlet_id')->constrained()->cascadeOnDelete();
            $table->foreignId('order_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('created_by_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('type', 20);
            $table->string('category', 100);
            $table->unsignedBigInteger('amount');
            $table->string('payment_method', 20)->nullable();
            $table->text('note')->nullable();
            $table->date('occurred_at');
            $table->timestamps();
            $table->index(['tenant_id', 'outlet_id', 'occurred_at']);
        });

        Schema::create('cash_closings', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('outlet_id')->constrained()->cascadeOnDelete();
            $table->foreignId('closed_by_id')->nullable()->constrained('users')->nullOnDelete();
            $table->date('date');
            $table->string('note')->nullable();
            $table->timestamps();
            $table->unique(['outlet_id', 'date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cash_closings');
        Schema::dropIfExists('cash_entries');
    }
};
