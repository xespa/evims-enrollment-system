<?php

use App\Http\Controllers\Student\DashboardController;
use App\Http\Controllers\Student\PasswordController;
use App\Http\Controllers\Student\SessionController;
use App\Http\Controllers\StudentAccountConsentController;
use Illuminate\Support\Facades\Route;

// A parent consenting to (or declining) their child's student account,
// from the emailed one-time link — no sign-in needed.
Route::middleware('throttle:20,1')->group(function () {
    Route::get('student-consent/{token}', [StudentAccountConsentController::class, 'show'])->name('student-consent.show');
    Route::put('student-consent/{token}', [StudentAccountConsentController::class, 'update'])->name('student-consent.update');
});

Route::prefix('student')->name('student.')->group(function () {
    Route::middleware('guest.student')->group(function () {
        Route::get('login', [SessionController::class, 'create'])->name('login');
        Route::post('login', [SessionController::class, 'store'])->name('login.store');
    });

    Route::middleware('auth:student')->group(function () {
        Route::post('logout', [SessionController::class, 'destroy'])->name('logout');
        Route::get('dashboard', DashboardController::class)->name('dashboard');
        Route::put('password', [PasswordController::class, 'update'])->name('password.update');
    });
});
