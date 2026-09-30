<?php

use App\Models\Event;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    Storage::fake('public');
    $this->admin = User::factory()->create(['role' => 'ADMIN']);
});

function schoolEvent(array $attributes = []): Event
{
    return Event::create([
        'title' => 'Foundation Day',
        'event_date' => '2026-12-08',
        ...$attributes,
    ]);
}

test('the events page lists every event for the modal to edit', function () {
    $event = schoolEvent(['tag' => 'Celebration', 'start_time' => '8:00 AM']);

    $this->actingAs($this->admin)
        ->get(route('admin.events.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Events/Index')
            ->where('events.0.id', $event->id)
            ->where('events.0.tag', 'Celebration')
            ->where('events.0.start_time', '8:00 AM')
        );
});

test('an event is created from the modal, with its image', function () {
    $this->actingAs($this->admin)
        ->post(route('admin.events.store'), [
            'title' => 'Science Fair',
            'tag' => 'Academic',
            'event_date' => '2026-11-20',
            'location' => 'Gymnasium',
            'image' => UploadedFile::fake()->image('fair.jpg'),
        ])
        ->assertRedirect(route('admin.events.index'))
        ->assertSessionHas('success', 'Event created.');

    $event = Event::sole();

    expect($event->title)->toBe('Science Fair')
        ->and($event->location)->toBe('Gymnasium');
    Storage::disk('public')->assertExists($event->image_path);
});

test('an invalid event keeps the modal open with its errors', function () {
    $this->actingAs($this->admin)
        ->from(route('admin.events.index'))
        ->post(route('admin.events.store'), ['title' => '', 'event_date' => ''])
        ->assertRedirect(route('admin.events.index'))
        ->assertSessionHasErrors(['title', 'event_date']);

    expect(Event::count())->toBe(0);
});

test('an event is updated from the modal, replacing its image', function () {
    $oldImage = UploadedFile::fake()->image('old.jpg')->store('events', 'public');
    $event = schoolEvent(['image_path' => $oldImage]);

    // File uploads are sent as POST with _method=patch.
    $this->actingAs($this->admin)
        ->post(route('admin.events.update', $event), [
            '_method' => 'patch',
            'title' => 'Foundation Day Celebration',
            'event_date' => '2026-12-09',
            'image' => UploadedFile::fake()->image('new.jpg'),
        ])
        ->assertRedirect(route('admin.events.index'));

    $event->refresh();

    expect($event->title)->toBe('Foundation Day Celebration')
        ->and($event->event_date->toDateString())->toBe('2026-12-09');
    Storage::disk('public')->assertMissing($oldImage);
    Storage::disk('public')->assertExists($event->image_path);
});

test('an event keeps its image when updated without a new one', function () {
    $image = UploadedFile::fake()->image('poster.jpg')->store('events', 'public');
    $event = schoolEvent(['image_path' => $image]);

    $this->actingAs($this->admin)
        ->post(route('admin.events.update', $event), [
            '_method' => 'patch',
            'title' => 'Foundation Day',
            'event_date' => '2026-12-08',
        ])
        ->assertRedirect(route('admin.events.index'));

    expect($event->fresh()->image_path)->toBe($image);
    Storage::disk('public')->assertExists($image);
});

test('deleting an event also deletes its image', function () {
    $image = UploadedFile::fake()->image('poster.jpg')->store('events', 'public');
    $event = schoolEvent(['image_path' => $image]);

    $this->actingAs($this->admin)
        ->from(route('admin.events.index'))
        ->delete(route('admin.events.destroy', $event))
        ->assertRedirect(route('admin.events.index'));

    expect(Event::count())->toBe(0);
    Storage::disk('public')->assertMissing($image);
});

test('the separate create and edit pages are gone', function () {
    $event = schoolEvent();

    expect(Route::has('admin.events.create'))->toBeFalse()
        ->and(Route::has('admin.events.edit'))->toBeFalse();

    $this->actingAs($this->admin)->get("/admin/events/{$event->id}/edit")->assertNotFound();
});
