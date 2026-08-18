<?php

use App\Models\User;

test('admin users are redirected to the admin dashboard', function () {
    $admin = User::factory()->create(['role' => 'ADMIN']);
    $this->actingAs($admin);

    $response = $this->get(route('dashboard'));
    $response->assertRedirect(route('admin.dashboard'));
});

test('staff users see the regular dashboard', function () {
    $staff = User::factory()->create(['role' => 'STAFF']);
    $this->actingAs($staff);

    $response = $this->get(route('dashboard'));
    $response->assertOk();
});
