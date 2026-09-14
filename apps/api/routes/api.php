<?php

use App\Domains\Billing\Http\Controllers\SubscriptionController;
use App\Domains\Catalog\Http\Controllers\CustomerController;
use App\Domains\Catalog\Http\Controllers\ServiceController;
use App\Domains\Identity\Http\Controllers\AuthController;
use App\Domains\Identity\Http\Controllers\DeviceTokenController;
use App\Domains\Identity\Http\Controllers\OutletController;
use App\Domains\Identity\Http\Controllers\PasswordResetController;
use App\Domains\Identity\Http\Controllers\UserController;
use App\Domains\Identity\Http\Middleware\EnsureSubscriptionActive;
use App\Domains\Operations\Http\Controllers\CashController;
use App\Domains\Operations\Http\Controllers\DeliveryTaskController;
use App\Domains\Ordering\Http\Controllers\OrderController;
use App\Domains\Ordering\Http\Controllers\TrackController;
use App\Domains\Support\Http\Controllers\DashboardController;
use App\Domains\Support\Http\Controllers\HealthController;
use App\Domains\Support\Http\Controllers\NotificationController;
use App\Domains\Support\Http\Controllers\ReportController;
use App\Domains\Support\Http\Middleware\EnsureIdempotency;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::pattern('order', '[0-9]+');
Route::pattern('outlet', '[0-9]+');
Route::pattern('customer', '[0-9]+');
Route::pattern('service', '[0-9]+');
Route::pattern('delivery_task', '[0-9]+');

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::prefix('v1')->group(function (): void {
    Route::get('/health', HealthController::class);

    Route::post('/auth/login', [AuthController::class, 'login'])->middleware('throttle:10,1');
    Route::post('/auth/forgot-password', [PasswordResetController::class, 'forgot'])->middleware('throttle:10,1');
    Route::post('/auth/reset-password', [PasswordResetController::class, 'reset'])->middleware('throttle:10,1');
    Route::post('/track', [TrackController::class, 'show'])->middleware('throttle:10,1');

    // Penyaji foto bukti: publik tapi wajib bertanda tangan (dibuat oleh
    // DeliveryTaskResource) dan kedaluwarsa, karena dipakai langsung oleh <img>.
    Route::get('/delivery-tasks/{delivery_task}/proof', [DeliveryTaskController::class, 'showProof'])
        ->middleware(['signed', 'throttle:60,1'])
        ->name('delivery-tasks.proof');

    Route::middleware(['auth:sanctum', EnsureSubscriptionActive::class, EnsureIdempotency::class])->group(function (): void {
        Route::post('/auth/logout', [AuthController::class, 'logout']);
        Route::get('/auth/me', [AuthController::class, 'me']);
        Route::post('/auth/device-token', [DeviceTokenController::class, 'store']);
        Route::delete('/auth/device-token', [DeviceTokenController::class, 'destroy']);

        Route::get('/subscription', [SubscriptionController::class, 'show']);
        Route::patch('/subscription', [SubscriptionController::class, 'update']);

        Route::get('/outlets', [OutletController::class, 'index']);
        Route::get('/outlets/{outlet}', [OutletController::class, 'show']);
        Route::post('/outlets', [OutletController::class, 'store']);
        Route::get('/users', [UserController::class, 'index']);
        Route::post('/users', [UserController::class, 'store']);

        Route::apiResource('customers', CustomerController::class)->except(['destroy']);
        Route::apiResource('services', ServiceController::class)->except(['destroy']);

        Route::apiResource('orders', OrderController::class)->only(['index', 'store', 'show']);
        Route::post('/orders/{order}/status', [OrderController::class, 'status']);
        Route::post('/orders/{order}/cancel', [OrderController::class, 'cancel']);

        Route::get('/dashboard/summary', [DashboardController::class, 'summary']);

        Route::get('/notifications', [NotificationController::class, 'index']);
        Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount']);
        Route::post('/notifications/{id}/read', [NotificationController::class, 'read']);

        Route::get('/reports/summary', [ReportController::class, 'summary']);
        Route::get('/reports/sales.csv', [ReportController::class, 'salesCsv']);

        Route::apiResource('delivery-tasks', DeliveryTaskController::class)->only(['index', 'store', 'show', 'update']);
        Route::post('/delivery-tasks/{delivery_task}/status', [DeliveryTaskController::class, 'status']);
        Route::post('/delivery-tasks/{delivery_task}/proof', [DeliveryTaskController::class, 'proof']);

        Route::get('/cash-entries', [CashController::class, 'index']);
        Route::post('/cash-entries', [CashController::class, 'store']);
        Route::get('/cash-entries/summary', [CashController::class, 'summary']);
        Route::post('/cash-entries/close', [CashController::class, 'close']);
        Route::post('/cash-entries/reopen', [CashController::class, 'reopen']);
    });
});
