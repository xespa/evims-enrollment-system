<?php

use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\EnrollmentManagementController;
use App\Http\Controllers\Admin\EventController;
use App\Http\Controllers\Admin\GradeLevelController;
use App\Http\Controllers\Admin\SettingsController;
use App\Http\Controllers\Admin\StudentController;
use App\Http\Controllers\Api\PhAddressController;
use App\Http\Controllers\EnrollmentController;
use App\Http\Controllers\PaymentController;
use App\Models\Event;
use App\Models\GradeLevel;
use Illuminate\Support\Facades\Route;

Route::prefix('api/ph-address')->name('api.ph-address.')->group(function () {
    Route::get('provinces', [PhAddressController::class, 'provinces'])->name('provinces');
    Route::get('cities/{provinceCode}', [PhAddressController::class, 'cities'])->name('cities');
    Route::get('barangays/{munCode}', [PhAddressController::class, 'barangays'])->name('barangays');
    Route::get('zip-codes', [PhAddressController::class, 'zipCodes'])->name('zip-codes');
});

Route::get('/', function () {
    return inertia('Site/Home', [
        'gradeLevels' => GradeLevel::orderBy('level_order')->get(['id', 'name']),
    ]);
})->name('home');
Route::inertia('/about', 'Site/About')->name('site.about');
Route::inertia('/academics/pre-elementary', 'Site/Academics/PreElementary')->name('site.academics.pre-elementary');
Route::inertia('/academics/lower-elementary', 'Site/Academics/LowerElementary')->name('site.academics.lower-elementary');
Route::inertia('/academics/upper-elementary', 'Site/Academics/UpperElementary')->name('site.academics.upper-elementary');
Route::inertia('/academics/high-school', 'Site/Academics/HighSchool')->name('site.academics.high-school');
Route::inertia('/student-services/guidance-counseling', 'Site/StudentServices/GuidanceCounseling')->name('site.student-services.guidance-counseling');
Route::inertia('/student-services/health-services', 'Site/StudentServices/HealthServices')->name('site.student-services.health-services');
Route::inertia('/student-services/library', 'Site/StudentServices/Library')->name('site.student-services.library');
Route::inertia('/contact', 'Site/Contact')->name('site.contact');
Route::get('/events', function () {
    $events = Event::upcoming()->orderBy('event_date')->get();

    if ($events->isEmpty()) {
        $events = Event::orderBy('event_date', 'desc')->limit(6)->get();
    }

    return inertia('Site/Events', [
        'events' => $events,
    ]);
})->name('site.events');
Route::get('/admission', [EnrollmentController::class, 'create'])->name('enrollment.create');
Route::post('/admission', [EnrollmentController::class, 'store'])->name('enrollment.store');
Route::get('/admission/{enrollment}/success', [EnrollmentController::class, 'success'])->name('enrollment.success');

Route::post('/admission/verify-lrn', [EnrollmentController::class, 'verifyLrn'])
    ->middleware('auth:enrollee')
    ->name('enrollment.verifyLrn');

Route::middleware('signed')->group(function () {
    Route::get('/payments/{enrollment}', [PaymentController::class, 'show'])->name('payments.show');
    Route::post('/payments/{enrollment}/installments/{installment}/gcash', [PaymentController::class, 'initiateGcash'])->name('payments.gcash.initiate');
});

// PayMongo callback + webhook stay unsigned — they're driven by PayMongo's own
// redirect/webhook, not something we can attach our signature to.
Route::get('/payments/{enrollment}/{installment}/success', [PaymentController::class, 'callbackSuccess'])->name('payments.callback.success');
Route::get('/payments/{enrollment}/{installment}/failed', [PaymentController::class, 'callbackFailed'])->name('payments.callback.failed');
Route::post('/paymongo/webhook', [PaymentController::class, 'webhook'])->name('paymongo.webhook');
Route::get('/payments/sandbox/{payment}/checkout', [PaymentController::class, 'sandboxCheckout'])->name('payments.sandbox.checkout');
Route::post('/payments/sandbox/{payment}/confirm', [PaymentController::class, 'sandboxConfirm'])->name('payments.sandbox.confirm');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return auth()->user()->isAdmin()
            ? redirect()->route('admin.dashboard')
            : inertia('dashboard');
    })->name('dashboard');
});

Route::middleware(['auth', 'admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('/students', [StudentController::class, 'index'])->name('students.index');
    Route::patch('/students/{student}/lrn', [StudentController::class, 'assignLrn'])->name('students.assignLrn');

    Route::get('/admissionments/{enrollment}', [EnrollmentManagementController::class, 'show'])->name('enrollments.show');
    Route::patch('/admissionments/{enrollment}/status', [EnrollmentManagementController::class, 'updateStatus'])->name('enrollments.updateStatus');
    Route::patch('/admissionments/{enrollment}/verification', [EnrollmentManagementController::class, 'updateVerification'])->name('enrollments.updateVerification');
    Route::post('/admissionments/{enrollment}/documents/{type}/remind', [EnrollmentManagementController::class, 'remindDocument'])
        ->whereIn('type', ['form_138', 'birth_certificate', 'good_moral'])
        ->name('enrollments.documents.remind');
    Route::post('/admissionments/{enrollment}/payments/cash', [EnrollmentManagementController::class, 'recordCashPayment'])->name('enrollments.payments.cash');
    Route::delete('/admissionments/{enrollment}', [EnrollmentManagementController::class, 'destroy'])->name('enrollments.destroy');

    Route::get('/grade-levels', [GradeLevelController::class, 'index'])->name('gradeLevels.index');
    Route::patch('/grade-levels/{gradeLevel}', [GradeLevelController::class, 'update'])->name('gradeLevels.update');

    Route::get('/events', [EventController::class, 'index'])->name('events.index');
    Route::get('/events/create', [EventController::class, 'create'])->name('events.create');
    Route::post('/events', [EventController::class, 'store'])->name('events.store');
    Route::get('/events/{event}/edit', [EventController::class, 'edit'])->name('events.edit');
    Route::patch('/events/{event}', [EventController::class, 'update'])->name('events.update');
    Route::delete('/events/{event}', [EventController::class, 'destroy'])->name('events.destroy');

    Route::redirect('/settings', '/admin/settings/profile');
    Route::get('/settings/profile', [SettingsController::class, 'editProfile'])->name('settings.profile.edit');
    Route::patch('/settings/profile', [SettingsController::class, 'updateProfile'])->name('settings.profile.update');
    Route::get('/settings/security', [SettingsController::class, 'editSecurity'])->name('settings.security.edit');
    Route::put('/settings/password', [SettingsController::class, 'updatePassword'])->name('settings.password.update');
    Route::delete('/settings', [SettingsController::class, 'destroy'])->name('settings.destroy');
});

require __DIR__.'/settings.php';
require __DIR__.'/portal.php';
