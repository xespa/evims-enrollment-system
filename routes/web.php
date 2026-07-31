<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\EnrollmentController;
use App\Http\Controllers\Admin\EnrollmentManagementController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\Admin\GradeLevelController;
use App\Http\Controllers\Admin\DashboardController;
use App\Models\GradeLevel;


Route::get('/', function () {
    return inertia('Site/Home', [
        'gradeLevels' => GradeLevel::orderBy('level_order')->get(['id', 'name']),
    ]);
})->name('home');
Route::inertia('/about', 'Site/About')->name('site.about');
Route::get('/admission', [EnrollmentController::class, 'create'])->name('enrollment.create');
Route::post('/admission', [EnrollmentController::class, 'store'])->name('enrollment.store');
Route::get('/admission/{enrollment}/success', [EnrollmentController::class, 'success'])->name('enrollment.success');

Route::get('/payments/{enrollment}', [PaymentController::class, 'show'])->name('payments.show');
Route::post('/payments/{enrollment}/installments/{installment}/gcash', [PaymentController::class, 'initiateGcash'])->name('payments.gcash.initiate');
Route::get('/payments/{enrollment}/{installment}/success', [PaymentController::class, 'callbackSuccess'])->name('payments.callback.success');
Route::get('/payments/{enrollment}/{installment}/failed', [PaymentController::class, 'callbackFailed'])->name('payments.callback.failed');

Route::post('/paymongo/webhook', [PaymentController::class, 'webhook'])->name('paymongo.webhook');
Route::get('/payments/sandbox/{payment}/checkout', [PaymentController::class, 'sandboxCheckout'])->name('payments.sandbox.checkout');
Route::post('/payments/sandbox/{payment}/confirm', [PaymentController::class, 'sandboxConfirm'])->name('payments.sandbox.confirm');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');
});

Route::middleware(['auth', 'admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('/admissionments', [EnrollmentManagementController::class, 'index'])->name('enrollments.index');
    Route::get('/admissionments/{enrollment}', [EnrollmentManagementController::class, 'show'])->name('enrollments.show');
    Route::patch('/admissionments/{enrollment}/status', [EnrollmentManagementController::class, 'updateStatus'])->name('enrollments.updateStatus');
    Route::patch('/admissionments/{enrollment}/verification', [EnrollmentManagementController::class, 'updateVerification'])->name('enrollments.updateVerification');
    Route::post('/admissionments/{enrollment}/payments/cash', [EnrollmentManagementController::class, 'recordCashPayment'])->name('enrollments.payments.cash');

    Route::get('/grade-levels', [GradeLevelController::class, 'index'])->name('gradeLevels.index');
    Route::patch('/grade-levels/{gradeLevel}', [GradeLevelController::class, 'update'])->name('gradeLevels.update');
});

require __DIR__.'/settings.php';
