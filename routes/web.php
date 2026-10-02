<?php

use App\Http\Controllers\Admin\CurriculumController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\EnrolleeAccountController;
use App\Http\Controllers\Admin\EnrolleeAccountValidIdController;
use App\Http\Controllers\Admin\EnrollmentArchiveController;
use App\Http\Controllers\Admin\EnrollmentDocumentController;
use App\Http\Controllers\Admin\EnrollmentManagementController;
use App\Http\Controllers\Admin\EventController;
use App\Http\Controllers\Admin\GradeLevelController;
use App\Http\Controllers\Admin\PayableEnrollmentController;
use App\Http\Controllers\Admin\SchoolYearController;
use App\Http\Controllers\Admin\SettingsController;
use App\Http\Controllers\Admin\StudentController;
use App\Http\Controllers\Admin\SubjectController;
use App\Http\Controllers\Admin\TransactionController;
use App\Http\Controllers\Admin\VoidPaymentController;
use App\Http\Controllers\Api\PhAddressController;
use App\Http\Controllers\EnrollmentController;
use App\Http\Controllers\PaymentController;
use App\Models\Curriculum;
use App\Models\Event;
use App\Models\GradeLevel;
use App\Models\OfficeVerification;
use Illuminate\Support\Facades\Route;

Route::prefix('api/ph-address')->name('api.ph-address.')->group(function () {
    Route::get('provinces', [PhAddressController::class, 'provinces'])->name('provinces');
    Route::get('cities/{provinceCode}', [PhAddressController::class, 'cities'])
        ->where('provinceCode', '[0-9]{4}')
        ->name('cities');
    Route::get('barangays/{munCode}', [PhAddressController::class, 'barangays'])
        ->where('munCode', '[0-9]{6}')
        ->name('barangays');
    Route::get('zip-codes', [PhAddressController::class, 'zipCodes'])->name('zip-codes');
});

Route::get('/', function () {
    return inertia('Site/Home', [
        'gradeLevels' => GradeLevel::orderBy('level_order')->get(['id', 'name']),
        // The school year applications are open for, or null if none is.
        'openSchoolYear' => Curriculum::applicationSchoolYear(),
    ]);
})->name('home');
Route::inertia('about', 'Site/About')->name('site.about');
Route::inertia('academics/pre-elementary', 'Site/Academics/PreElementary')->name('site.academics.pre-elementary');
Route::inertia('academics/lower-elementary', 'Site/Academics/LowerElementary')->name('site.academics.lower-elementary');
Route::inertia('academics/upper-elementary', 'Site/Academics/UpperElementary')->name('site.academics.upper-elementary');
Route::inertia('academics/high-school', 'Site/Academics/HighSchool')->name('site.academics.high-school');
Route::inertia('student-services/guidance-counseling', 'Site/StudentServices/GuidanceCounseling')->name('site.student-services.guidance-counseling');
Route::inertia('student-services/health-services', 'Site/StudentServices/HealthServices')->name('site.student-services.health-services');
Route::inertia('student-services/library', 'Site/StudentServices/Library')->name('site.student-services.library');
Route::inertia('contact', 'Site/Contact')->name('site.contact');
Route::inertia('terms', 'Site/Terms')->name('site.terms');
Route::get('events', function () {
    return inertia('Site/Events', [
        // Every event the school has posted — they don't expire — with the
        // newest date first.
        'events' => Event::query()->orderByDesc('event_date')->orderByDesc('id')->get(),
    ]);
})->name('site.events');
// Applying needs a portal account with a confirmed email, so every
// application belongs to someone the school can reach.
Route::middleware(['auth:enrollee', 'verified:portal.verification.notice'])->group(function () {
    // Shown to every account, but unapproved ones only see a notice.
    Route::get('admission', [EnrollmentController::class, 'create'])->name('admission.create');
    Route::get('admission/{enrollment}/success', [EnrollmentController::class, 'success'])->name('admission.success');

    // Only accounts the school has approved can apply, so nothing from an
    // unverified account ever reaches the admin.
    Route::middleware('enrollee.approved')->group(function () {
        Route::post('admission', [EnrollmentController::class, 'store'])->name('admission.store');
        Route::post('admission/verify-lrn', [EnrollmentController::class, 'verifyLrn'])->name('admission.verify-lrn');
    });
});

Route::middleware('signed')->group(function () {
    Route::get('payments/{enrollment}', [PaymentController::class, 'show'])->name('payments.show');
    Route::post('payments/{enrollment}/installments/{installment}/gcash', [PaymentController::class, 'initiateGcash'])->name('payments.gcash.initiate');

    // The GCash return URLs are signed when we hand them to PayMongo, which
    // redirects to them unchanged — so they can safely link to the payment page.
    Route::get('payments/{enrollment}/installments/{installment}/success', [PaymentController::class, 'callbackSuccess'])->name('payments.callback.success');
    Route::get('payments/{enrollment}/installments/{installment}/failed', [PaymentController::class, 'callbackFailed'])->name('payments.callback.failed');
});

// The webhook stays unsigned: PayMongo calls it directly, and it's verified by
// its own Paymongo-Signature HMAC instead.
Route::post('paymongo/webhook', [PaymentController::class, 'webhook'])->name('paymongo.webhook');
Route::get('payments/sandbox/{payment}/checkout', [PaymentController::class, 'sandboxCheckout'])->name('payments.sandbox.checkout');
Route::post('payments/sandbox/{payment}/confirm', [PaymentController::class, 'sandboxConfirm'])->name('payments.sandbox.confirm');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return auth()->user()->isAdmin()
            ? redirect()->route('admin.dashboard')
            : inertia('dashboard');
    })->name('dashboard');
});

Route::middleware(['auth', 'admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');

    Route::resource('students', StudentController::class)->only(['index']);
    Route::patch('students/{student}/lrn', [StudentController::class, 'assignLrn'])->name('students.lrn.update');

    Route::resource('enrollments', EnrollmentManagementController::class)->only(['show', 'destroy']);
    Route::post('enrollments/{enrollment}/archive', [EnrollmentArchiveController::class, 'store'])->name('enrollments.archive.store');
    Route::delete('enrollments/{enrollment}/archive', [EnrollmentArchiveController::class, 'destroy'])->name('enrollments.archive.destroy');
    Route::patch('enrollments/{enrollment}/status', [EnrollmentManagementController::class, 'updateStatus'])->name('enrollments.status.update');
    Route::patch('enrollments/{enrollment}/verification', [EnrollmentManagementController::class, 'updateVerification'])->name('enrollments.verification.update');
    Route::post('enrollments/{enrollment}/documents/{type}', [EnrollmentDocumentController::class, 'store'])
        ->whereIn('type', array_keys(OfficeVerification::DOCUMENT_COLUMNS))
        ->name('enrollments.documents.store');
    Route::post('enrollments/{enrollment}/documents/{type}/remind', [EnrollmentManagementController::class, 'remindDocument'])
        ->whereIn('type', ['form_138', 'birth_certificate', 'good_moral'])
        ->name('enrollments.documents.remind');
    Route::post('enrollments/{enrollment}/cash-payments', [EnrollmentManagementController::class, 'recordCashPayment'])->name('enrollments.cash-payments.store');
    Route::post('payments/{payment}/void', VoidPaymentController::class)->name('payments.void');
    // Student lookup for recording a counter payment from Transactions.
    Route::get('payable-enrollments', PayableEnrollmentController::class)->name('payable-enrollments.index');

    // Parent portal accounts awaiting approval before they can use the portal and pay online.
    Route::resource('enrollee-accounts', EnrolleeAccountController::class)
        ->only(['index', 'update'])
        ->parameters(['enrollee-accounts' => 'enrolleeUser']);
    Route::get('enrollee-accounts/{enrolleeUser}/valid-id', EnrolleeAccountValidIdController::class)->name('enrollee-accounts.valid-id.show');

    Route::resource('grade-levels', GradeLevelController::class)->only(['index', 'show']);
    // Setting up a school year: store starts a draft, update saves it
    // (opening enrollment), destroy cancels it.
    Route::resource('school-years', SchoolYearController::class)
        ->only(['store', 'update', 'destroy'])
        ->parameters(['school-years' => 'schoolYear'])
        ->where(['schoolYear' => '\d{4}-\d{4}']);
    // A curriculum is one grade level's fees + subjects for one school year.
    Route::resource('curricula', CurriculumController::class)->only(['update']);
    Route::resource('curricula.subjects', SubjectController::class)->shallow()->only(['store', 'update', 'destroy']);

    Route::resource('transactions', TransactionController::class)
        ->only(['index', 'show'])
        ->parameters(['transactions' => 'payment']);

    // Creating and editing happen in a modal on the index page.
    Route::resource('events', EventController::class)->only(['index', 'store', 'update', 'destroy']);

    Route::redirect('settings', '/admin/settings/profile');
    Route::get('settings/profile', [SettingsController::class, 'editProfile'])->name('settings.profile.edit');
    Route::patch('settings/profile', [SettingsController::class, 'updateProfile'])->name('settings.profile.update');
    Route::get('settings/security', [SettingsController::class, 'editSecurity'])->name('settings.security.edit');
    Route::put('settings/password', [SettingsController::class, 'updatePassword'])->name('settings.password.update');
    Route::delete('settings', [SettingsController::class, 'destroy'])->name('settings.destroy');
});

require __DIR__.'/settings.php';
require __DIR__.'/portal.php';
