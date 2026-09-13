<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Postgres tidak otomatis mengindeks kolom foreign key. Index ini menutup
     * query tenant-scoped dan query reminder pickup yang tadinya seq-scan.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->index('tenant_id', 'users_tenant_id_index');
            $table->index('outlet_id', 'users_outlet_id_index');
        });

        Schema::table('customers', function (Blueprint $table): void {
            $table->index('outlet_id', 'customers_outlet_id_index');
        });

        Schema::table('services', function (Blueprint $table): void {
            $table->index(['tenant_id', 'outlet_id'], 'services_tenant_outlet_index');
        });

        Schema::table('orders', function (Blueprint $table): void {
            $table->index('customer_id', 'orders_customer_id_index');
            $table->index('outlet_id', 'orders_outlet_id_index');
        });

        Schema::table('order_items', function (Blueprint $table): void {
            $table->index('order_id', 'order_items_order_id_index');
            $table->index('service_id', 'order_items_service_id_index');
        });

        Schema::table('order_status_histories', function (Blueprint $table): void {
            $table->index('order_id', 'order_status_histories_order_id_index');
            $table->index('changed_by_id', 'order_status_histories_changed_by_id_index');
        });

        Schema::table('delivery_tasks', function (Blueprint $table): void {
            $table->index('order_id', 'delivery_tasks_order_id_index');
            $table->index(
                ['type', 'status', 'driver_id', 'reminder_sent_at', 'scheduled_at'],
                'delivery_tasks_reminder_index'
            );
        });

        Schema::table('cash_entries', function (Blueprint $table): void {
            $table->index('order_id', 'cash_entries_order_id_index');
            $table->index('created_by_id', 'cash_entries_created_by_id_index');
        });

        Schema::table('cash_closings', function (Blueprint $table): void {
            $table->index('closed_by_id', 'cash_closings_closed_by_id_index');
        });

        Schema::table('activity_logs', function (Blueprint $table): void {
            $table->index('actor_id', 'activity_logs_actor_id_index');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->dropIndex('users_tenant_id_index');
            $table->dropIndex('users_outlet_id_index');
        });

        Schema::table('customers', function (Blueprint $table): void {
            $table->dropIndex('customers_outlet_id_index');
        });

        Schema::table('services', function (Blueprint $table): void {
            $table->dropIndex('services_tenant_outlet_index');
        });

        Schema::table('orders', function (Blueprint $table): void {
            $table->dropIndex('orders_customer_id_index');
            $table->dropIndex('orders_outlet_id_index');
        });

        Schema::table('order_items', function (Blueprint $table): void {
            $table->dropIndex('order_items_order_id_index');
            $table->dropIndex('order_items_service_id_index');
        });

        Schema::table('order_status_histories', function (Blueprint $table): void {
            $table->dropIndex('order_status_histories_order_id_index');
            $table->dropIndex('order_status_histories_changed_by_id_index');
        });

        Schema::table('delivery_tasks', function (Blueprint $table): void {
            $table->dropIndex('delivery_tasks_order_id_index');
            $table->dropIndex('delivery_tasks_reminder_index');
        });

        Schema::table('cash_entries', function (Blueprint $table): void {
            $table->dropIndex('cash_entries_order_id_index');
            $table->dropIndex('cash_entries_created_by_id_index');
        });

        Schema::table('cash_closings', function (Blueprint $table): void {
            $table->dropIndex('cash_closings_closed_by_id_index');
        });

        Schema::table('activity_logs', function (Blueprint $table): void {
            $table->dropIndex('activity_logs_actor_id_index');
        });
    }
};
