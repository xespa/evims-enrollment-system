<?php

use App\Models\Enrollment;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    // October 2026 falls in SY 2026-2027.
    $this->travelTo('2026-10-15');
    $this->admin = User::factory()->admin()->create();
});

test('the school year filters start on the current school year', function (string $routeName) {
    // Only an older year has applications, so the current one is still offered.
    Enrollment::factory()->create(['school_year' => '2025-2026']);

    $this->actingAs($this->admin)
        ->get(route($routeName))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('filters.school_year', '2026-2027')
            ->where('schoolYears', fn ($schoolYears) => collect($schoolYears)->contains('2026-2027')));
})->with([
    'dashboard' => 'admin.dashboard',
    'students' => 'admin.students.index',
    'billing and collections' => 'admin.transactions.index',
    'transaction history' => 'admin.transaction-history.index',
    'grade sheets' => 'admin.grade-sheets.index',
]);

test('choosing "All school years" still shows every year', function (string $routeName) {
    $this->actingAs($this->admin)
        ->get(route($routeName, ['school_year' => '']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->where('filters.school_year', ''));
})->with([
    'dashboard' => 'admin.dashboard',
    'students' => 'admin.students.index',
    'billing and collections' => 'admin.transactions.index',
    'transaction history' => 'admin.transaction-history.index',
    'grade sheets' => 'admin.grade-sheets.index',
]);

test('the students list shows only the current school year until another is chosen', function () {
    $current = Enrollment::factory()->create(['school_year' => '2026-2027']);
    $lastYear = Enrollment::factory()->create(['school_year' => '2025-2026']);

    $this->actingAs($this->admin)
        ->get(route('admin.students.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->has('applications.data', 1)
            ->where('applications.data.0.id', $current->id));

    $this->get(route('admin.students.index', ['school_year' => '']))
        ->assertInertia(fn (Assert $page) => $page->has('applications.data', 2));

    $this->get(route('admin.students.index', ['school_year' => '2025-2026']))
        ->assertInertia(fn (Assert $page) => $page
            ->has('applications.data', 1)
            ->where('applications.data.0.id', $lastYear->id));
});

test('a new grade sheet starts on the current school year', function () {
    $this->actingAs($this->admin)
        ->get(route('admin.grade-sheets.create'))
        ->assertInertia(fn (Assert $page) => $page->where('defaultSchoolYear', '2026-2027'));
});

test('a teacher\'s subjects page starts on the current school year', function () {
    $this->actingAs(User::factory()->teacher()->create())
        ->get(route('admin.settings.subjects.edit'))
        ->assertInertia(fn (Assert $page) => $page->where('currentSchoolYear', '2026-2027'));
});
