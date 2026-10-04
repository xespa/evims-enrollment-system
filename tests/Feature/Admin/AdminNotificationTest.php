<?php

use App\Models\User;
use App\Notifications\EnrollmentPeriodReminder;
use Illuminate\Notifications\DatabaseNotification;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;

function notifyUser(User $user, string $title): DatabaseNotification
{
    return $user->notifications()->create([
        'id' => (string) Str::uuid(),
        'type' => EnrollmentPeriodReminder::class,
        'data' => ['title' => $title, 'message' => $title, 'url' => '/admin/grade-levels'],
    ]);
}

beforeEach(function () {
    $this->admin = User::factory()->create(['role' => 'ADMIN']);
});

test('an admin only sees their own notifications', function () {
    notifyUser($this->admin, 'Mine');
    notifyUser(User::factory()->create(['role' => 'ADMIN']), 'Not mine');

    $this->actingAs($this->admin)
        ->getJson(route('admin.notifications.index'))
        ->assertOk()
        ->assertJsonCount(1, 'notifications')
        ->assertJsonPath('notifications.0.data.title', 'Mine')
        ->assertJsonPath('unread_count', 1);
});

test('an admin can mark one notification read', function () {
    $notification = notifyUser($this->admin, 'One');
    $other = notifyUser($this->admin, 'Two');

    $this->actingAs($this->admin)
        ->postJson(route('admin.notifications.read', $notification->id))
        ->assertNoContent();

    expect($notification->fresh()->read_at)->not->toBeNull()
        ->and($other->fresh()->read_at)->toBeNull();
});

test('an admin cannot mark someone else\'s notification read', function () {
    $notification = notifyUser(User::factory()->create(['role' => 'ADMIN']), 'Not mine');

    $this->actingAs($this->admin)->postJson(route('admin.notifications.read', $notification->id));

    expect($notification->fresh()->read_at)->toBeNull();
});

test('an admin can mark every notification read', function () {
    notifyUser($this->admin, 'One');
    notifyUser($this->admin, 'Two');

    $this->actingAs($this->admin)
        ->postJson(route('admin.notifications.read-all'))
        ->assertNoContent();

    expect($this->admin->unreadNotifications()->count())->toBe(0);
});

test('admin pages share the unread count', function () {
    notifyUser($this->admin, 'One');

    $this->actingAs($this->admin)
        ->get(route('admin.events.index'))
        ->assertInertia(fn (Assert $page) => $page->where('auth.userUnreadNotificationsCount', 1));
});

test('only admins can use the admin notifications', function () {
    $this->getJson(route('admin.notifications.index'))->assertUnauthorized();
    $this->actingAs(User::factory()->create(['role' => 'STAFF']))
        ->getJson(route('admin.notifications.index'))
        ->assertForbidden();
});
