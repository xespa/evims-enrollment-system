<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\EnrollmentController;
use App\Http\Controllers\Admin\EnrollmentManagementController;


Route::inertia('/', 'welcome')->name('home');
Route::get('/enroll', [EnrollmentController::class, 'create'])->name('enrollment.create');
Route::post('/enroll', [EnrollmentController::class, 'store'])->name('enrollment.store');
Route::get('/enroll/{enrollment}/success', [EnrollmentController::class, 'success'])->name('enrollment.success');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');
});

Route::middleware(['auth', 'admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/enrollments', [EnrollmentManagementController::class, 'index'])->name('enrollments.index');
    Route::get('/enrollments/{enrollment}', [EnrollmentManagementController::class, 'show'])->name('enrollments.show');
    Route::patch('/enrollments/{enrollment}/status', [EnrollmentManagementController::class, 'updateStatus'])->name('enrollments.updateStatus');
    Route::patch('/enrollments/{enrollment}/verification', [EnrollmentManagementController::class, 'updateVerification'])->name('enrollments.updateVerification');
});

require __DIR__.'/settings.php';
