<?php

use App\Models\User;

test('admin users are redirected to the admin dashboard', function () {
    $admin = User::factory()->create(['role' => 'ADMIN']);
    $this->actingAs($admin);

    $response = $this->get(route('dashboard'));
    $response->assertRedirect(route('admin.dashboard'));
});

test('staff without the dashboard are sent to the page they work from', function (string $role, string $home) {
    $this->actingAs(User::factory()->create(['role' => $role]));

    $this->get(route('dashboard'))->assertRedirect(route($home));
})->with([
    'registrar' => ['REGISTRAR', 'admin.dashboard'],
    'teacher' => ['TEACHER', 'admin.students.index'],
    'cashier' => ['CASHIER', 'admin.transactions.index'],
]);
