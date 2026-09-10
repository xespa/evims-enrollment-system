<?php

use App\Http\Controllers\Portal\AuthController;
use App\Http\Controllers\Portal\DashboardController;
use App\Http\Controllers\Portal\VerificationController;
use Illuminate\Support\Facades\Route;

Route::prefix('portal')->name('portal.')->group(function () {
    Route::middleware('guest:enrollee')->group(function () {
        Route::get('register', [AuthController::class, 'create'])->name('register');
        Route::post('register', [AuthController::class, 'store'])->name('register.store');
        Route::get('login', [AuthController::class, 'showLogin'])->name('login');
        Route::post('login', [AuthController::class, 'login'])->name('login.store');
    });

    Route::middleware('auth:enrollee')->group(function () {
        Route::post('logout', [AuthController::class, 'logout'])->name('logout');

        Route::get('verify-email', [VerificationController::class, 'notice'])->name('verification.notice');
        Route::get('verify-email/{id}/{hash}', [VerificationController::class, 'verify'])
            ->middleware('signed')
            ->name('verification.verify');
        Route::post('email/resend', [VerificationController::class, 'resend'])
            ->middleware('throttle:6,1')
            ->name('verification.resend');

        Route::middleware('verified:portal.verification.notice')->group(function () {
            Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');
            Route::post('enrollments/{enrollment}/cancel', [DashboardController::class, 'cancel'])->name('enrollments.cancel');
        });
    });
});
