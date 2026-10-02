<?php

use App\Enums\AccountRejectionReason;
use App\Enums\AccountStatus;
use App\Models\BillingContract;
use App\Models\EnrolleeUser;
use App\Models\Enrollment;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;
use Inertia\Testing\AssertableInertia as Assert;

function approvedGcashEnrollmentFor(EnrolleeUser $enrollee): Enrollment
{
    $enrollment = Enrollment::factory()->create([
        'enrollee_user_id' => $enrollee->id,
        'enrollment_status' => 'APPROVED',
    ]);

    $enrollment->billingContract()->create([
        'payment_option' => 'MONTHLY',
        'payment_channel' => BillingContract::CHANNEL_GCASH,
        'total_fee' => 10000,
    ])->generateInstallments();

    return $enrollment;
}

test('new portal accounts start pending review', function () {
    Notification::fake();
    Storage::fake('local');

    $this->post(route('portal.register.store'), [
        'name' => 'Juan Dela Cruz',
        'email' => 'juan@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
        'valid_id' => UploadedFile::fake()->image('valid-id.jpg'),
        'account_type' => 'PARENT_GUARDIAN',
        'terms' => '1',
    ]);

    expect(EnrolleeUser::where('email', 'juan@example.com')->first()->account_status)
        ->toBe(AccountStatus::Pending);
});

test('pending accounts are sent to the awaiting approval page', function () {
    $enrollee = EnrolleeUser::factory()->pending()->create();

    $this->actingAs($enrollee, 'enrollee')
        ->get(route('portal.dashboard'))
        ->assertRedirect(route('portal.account-status'));

    $this->actingAs($enrollee, 'enrollee')
        ->get(route('portal.account-status'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Portal/AccountStatus')
            ->where('status', 'PENDING'));
});

test('rejected accounts see why they were not approved', function () {
    $enrollee = EnrolleeUser::factory()
        ->rejected([AccountRejectionReason::BlurryId], 'The birthdate is hard to read.')
        ->create();

    $this->actingAs($enrollee, 'enrollee')
        ->get(route('portal.dashboard'))
        ->assertRedirect(route('portal.account-status'));

    $this->actingAs($enrollee, 'enrollee')
        ->get(route('portal.account-status'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('status', 'REJECTED')
            ->where('rejectionReasons.0.label', AccountRejectionReason::BlurryId->label())
            ->where('rejectionReasons.0.guidance', AccountRejectionReason::BlurryId->guidance())
            ->where('rejectionNote', 'The birthdate is hard to read.')
            ->where('hasResubmittedId', false));
});

test('approved accounts reach the dashboard and skip the approval page', function () {
    $enrollee = EnrolleeUser::factory()->create();

    $this->actingAs($enrollee, 'enrollee')->get(route('portal.dashboard'))->assertOk();

    $this->actingAs($enrollee, 'enrollee')
        ->get(route('portal.account-status'))
        ->assertRedirect(route('portal.dashboard'));
});

test('unverified emails are asked to verify before approval status', function () {
    $enrollee = EnrolleeUser::factory()->pending()->unverified()->create();

    $this->actingAs($enrollee, 'enrollee')
        ->get(route('portal.account-status'))
        ->assertRedirect(route('portal.verification.notice'));
});

test('pending accounts cannot cancel applications', function () {
    $enrollee = EnrolleeUser::factory()->pending()->create();
    $enrollment = Enrollment::factory()->create(['enrollee_user_id' => $enrollee->id]);

    $this->actingAs($enrollee, 'enrollee')
        ->post(route('portal.enrollments.cancel', $enrollment))
        ->assertRedirect(route('portal.account-status'));

    expect($enrollment->fresh()->enrollment_status)->toBe('PENDING');
});

test('accounts that are not approved cannot pay online', function () {
    $enrollee = EnrolleeUser::factory()->pending()->create();
    $enrollment = approvedGcashEnrollmentFor($enrollee);
    $installment = $enrollment->billingContract->installments()->first();

    $this->get(URL::signedRoute('payments.show', $enrollment->id))->assertForbidden();

    $this->post(URL::signedRoute('payments.gcash.initiate', [
        'enrollment' => $enrollment->id,
        'installment' => $installment->id,
    ]))->assertForbidden();

    expect($installment->payments()->count())->toBe(0);
});

test('approved accounts can open the online payment page', function () {
    $enrollment = approvedGcashEnrollmentFor(EnrolleeUser::factory()->create());

    $this->get(URL::signedRoute('payments.show', $enrollment->id))->assertOk();
});
