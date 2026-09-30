<?php

use App\Http\Controllers\Portal\AuthController;
use App\Http\Controllers\Portal\DashboardController;
use App\Http\Controllers\Portal\NotificationController;
use App\Http\Controllers\Portal\ProfileController;
use App\Http\Controllers\Portal\VerificationController;
use Illuminate\Support\Facades\Route;

Route::prefix('portal')->name('portal.')->group(function () {
    Route::middleware('guest.enrollee')->group(function () {
        Route::get('register', [AuthController::class, 'create'])->name('register');
        Route::post('register', [AuthController::class, 'store'])->name('register.store');
        Route::get('login', [AuthController::class, 'showLogin'])->name('login');
        Route::post('login', [AuthController::class, 'login'])->name('login.store');
    });

    Route::middleware('auth:enrollee')->group(function () {
        Route::post('logout', [AuthController::class, 'logout'])->name('logout');

        Route::get('email/verify', [VerificationController::class, 'notice'])->name('verification.notice');
        Route::get('email/verify/{id}/{hash}', [VerificationController::class, 'verify'])
            ->middleware('signed')
            ->name('verification.verify');
        Route::post('email/verification-notification', [VerificationController::class, 'resend'])
            ->middleware('throttle:6,1')
            ->name('verification.send');

        Route::post('profile/photo', [ProfileController::class, 'updatePhoto'])->name('profile.photo.update');

        Route::get('notifications', [NotificationController::class, 'index'])->name('notifications.index');
        Route::post('notifications/read-all', [NotificationController::class, 'readAll'])->name('notifications.read-all');
        Route::post('notifications/{notification}/read', [NotificationController::class, 'read'])->name('notifications.read');

        Route::middleware('verified:portal.verification.notice')->group(function () {
            Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');
            Route::post('enrollments/{enrollment}/cancel', [DashboardController::class, 'cancel'])->name('enrollments.cancel');
            Route::post('enrollments/{enrollment}/documents/{type}', [DashboardController::class, 'uploadDocument'])
                ->whereIn('type', ['form_138', 'birth_certificate', 'good_moral'])
                ->name('enrollments.documents.store');
        });
    });
});
