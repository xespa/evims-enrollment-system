<?php

use App\Models\BillingContract;
use App\Models\EnrolleeUser;
use App\Models\Enrollment;
use App\Models\GradeLevel;
use App\Models\Subject;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    Storage::fake('public');
    Notification::fake();
    $this->actingAs(EnrolleeUser::factory()->create(), 'enrollee');
});

test('an application cannot be submitted without agreeing to the tuition terms', function (mixed $answer) {
    $gradeLevel = GradeLevel::factory()->totalFee(30000)->create();

    $this->post(route('admission.store'), validEnrollmentPayload($gradeLevel, ['tuition_terms_accepted' => $answer]))
        ->assertSessionHasErrors([
            'tuition_terms_accepted' => 'Please read and agree to the tuition fee contract and withdrawal procedure.',
        ]);

    expect(Enrollment::count())->toBe(0);
})->with([
    'unticked' => false,
    'missing' => null,
]);

test('agreeing to the tuition terms is recorded on the billing contract', function () {
    $this->freezeTime();
    $gradeLevel = GradeLevel::factory()->totalFee(30000)->create();
    Subject::create(['curriculum_id' => $gradeLevel->curricula()->first()->id, 'name' => 'Math', 'code' => 'MATH1']);

    $this->post(route('admission.store'), validEnrollmentPayload($gradeLevel))
        ->assertSessionHasNoErrors();

    expect(BillingContract::sole()->terms_accepted_at?->toDateTimeString())->toBe(now()->toDateTimeString());
});
