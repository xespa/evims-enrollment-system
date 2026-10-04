<?php

use App\Enums\EnrollmentPeriodMilestone;
use App\Models\Curriculum;
use App\Models\Enrollment;
use App\Models\EnrollmentPeriod;
use App\Models\User;
use App\Notifications\EnrollmentPeriodReminder;
use Illuminate\Console\Scheduling\Event;
use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Support\Facades\Notification;

beforeEach(function () {
    $this->travelTo(now('Asia/Manila')->setDate(2026, 10, 4)->setTime(7, 0));
    $this->admin = User::factory()->create(['role' => 'ADMIN']);
    $this->schoolYear = Enrollment::currentSchoolYear();
});

test('admins are reminded that enrollment opens soon', function () {
    Notification::fake();
    $staff = User::factory()->create(['role' => 'STAFF']);
    EnrollmentPeriod::factory()->opensIn(EnrollmentPeriod::REMINDER_DAYS_AHEAD)->create(['school_year' => $this->schoolYear]);

    $this->artisan('enrollment:send-period-reminders')->assertSuccessful();

    Notification::assertSentTo($this->admin, EnrollmentPeriodReminder::class, fn (EnrollmentPeriodReminder $reminder) => $reminder->milestone === EnrollmentPeriodMilestone::OpeningSoon
        && $reminder->schoolYear === $this->schoolYear
        && $reminder->daysLeft === EnrollmentPeriod::REMINDER_DAYS_AHEAD);
    Notification::assertNotSentTo($staff, EnrollmentPeriodReminder::class);
    Notification::assertSentTimes(EnrollmentPeriodReminder::class, 1);
});

test('admins are not reminded before the reminder window', function () {
    Notification::fake();
    EnrollmentPeriod::factory()->opensIn(EnrollmentPeriod::REMINDER_DAYS_AHEAD + 1)->create(['school_year' => $this->schoolYear]);

    $this->artisan('enrollment:send-period-reminders')->assertSuccessful();

    Notification::assertNothingSent();
});

test('admins are reminded that enrollment closes soon', function () {
    Notification::fake();
    EnrollmentPeriod::factory()->closesIn(1)->create(['school_year' => $this->schoolYear]);

    $this->artisan('enrollment:send-period-reminders')->assertSuccessful();

    Notification::assertSentTo($this->admin, EnrollmentPeriodReminder::class, fn (EnrollmentPeriodReminder $reminder) => $reminder->milestone === EnrollmentPeriodMilestone::ClosingSoon
        && $reminder->daysLeft === 1);
    Notification::assertSentTimes(EnrollmentPeriodReminder::class, 1);
});

test('admins are told when enrollment has ended', function () {
    Notification::fake();
    $period = EnrollmentPeriod::factory()->closesIn(10)->create(['school_year' => $this->schoolYear]);
    $this->travel(11)->days();

    $this->artisan('enrollment:send-period-reminders')->assertSuccessful();

    Notification::assertSentTo($this->admin, EnrollmentPeriodReminder::class, fn (EnrollmentPeriodReminder $reminder) => $reminder->milestone === EnrollmentPeriodMilestone::Closed
        && $reminder->date->toDateString() === $period->closes_on->toDateString());
    Notification::assertSentTimes(EnrollmentPeriodReminder::class, 1);
});

test('each reminder is only sent once', function () {
    Notification::fake();
    EnrollmentPeriod::factory()->opensIn(1)->create(['school_year' => $this->schoolYear]);

    $this->artisan('enrollment:send-period-reminders');
    $this->artisan('enrollment:send-period-reminders');

    Notification::assertSentTimes(EnrollmentPeriodReminder::class, 1);
    expect(EnrollmentPeriod::sole()->opening_reminder_sent_at)->not->toBeNull();
});

test('moving the opening date sends the reminder again for the new date', function () {
    Notification::fake();
    $period = EnrollmentPeriod::factory()->opensIn(1)->create(['school_year' => $this->schoolYear]);
    $this->artisan('enrollment:send-period-reminders');

    $period->refresh()->update(['opens_on' => EnrollmentPeriod::today()->addDays(10)]);
    $this->travel(8)->days();
    $this->artisan('enrollment:send-period-reminders');

    Notification::assertSentTimes(EnrollmentPeriodReminder::class, 2);
});

test('the reminder lands in the admin\'s notifications and inbox', function () {
    Curriculum::factory()->create(['school_year' => $this->schoolYear, 'is_draft' => true]);
    EnrollmentPeriod::factory()->opensIn(1)->create(['school_year' => $this->schoolYear]);

    $this->artisan('enrollment:send-period-reminders');

    $data = $this->admin->notifications()->sole()->data;

    expect($data['type'])->toBe('enrollment_period')
        ->and($data['status'])->toBe('OPENING_SOON')
        ->and($data['title'])->toBe("Enrollment for {$this->schoolYear} opens soon")
        ->and($data['message'])->toBe("Enrollment for S.Y. {$this->schoolYear} opens tomorrow, October 5, 2026. It is still a draft — review and save it, or parents won't be able to apply.")
        ->and($data['url'])->toBe(route('admin.grade-levels.index', ['school_year' => $this->schoolYear], false));
});

test('the reminders run every morning', function () {
    $event = collect(app(Schedule::class)->events())
        ->first(fn (Event $event) => str_contains($event->command ?? '', 'enrollment:send-period-reminders'));

    expect($event)->not->toBeNull()
        ->and($event->expression)->toBe('0 7 * * *')
        ->and($event->timezone)->toBe('Asia/Manila');
});
