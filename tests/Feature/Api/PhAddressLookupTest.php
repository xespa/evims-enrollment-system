<?php

use Illuminate\Support\Facades\Cache;

test('lists every province sorted by name', function () {
    $provinces = $this->get(route('api.ph-address.provinces'))
        ->assertOk()
        ->json();

    $names = array_column($provinces, 'name');
    $sorted = $names;
    sort($sorted);

    expect($names)->toBe($sorted)
        ->and($provinces)->toContain(['name' => 'ILOCOS NORTE', 'reg_code' => '01', 'prov_code' => '0128']);
});

test('lists only the cities of the given province', function () {
    $cities = $this->get(route('api.ph-address.cities', '0128'))
        ->assertOk()
        ->json();

    expect($cities)->not->toBeEmpty()
        ->and(array_unique(array_column($cities, 'prov_code')))->toBe(['0128'])
        ->and($cities)->toContain(['name' => 'ADAMS', 'prov_code' => '0128', 'mun_code' => '012801']);
});

test('lists only the barangays of the given municipality', function () {
    $barangays = $this->get(route('api.ph-address.barangays', '012801'))
        ->assertOk()
        ->json();

    expect($barangays)->not->toBeEmpty()
        ->and(array_unique(array_column($barangays, 'mun_code')))->toBe(['012801'])
        ->and($barangays)->toContain(['name' => 'Adams (Pob.)', 'mun_code' => '012801']);
});

test('returns an empty list for an unknown but well-formed code', function () {
    $this->get(route('api.ph-address.cities', '9999'))->assertOk()->assertExactJson([]);
    $this->get(route('api.ph-address.barangays', '999999'))->assertOk()->assertExactJson([]);
});

test('rejects malformed codes', function (string $uri) {
    $this->get($uri)->assertNotFound();
})->with([
    'province code with letters' => '/api/ph-address/cities/01ab',
    'province code too long' => '/api/ph-address/cities/01280',
    'municipality code too short' => '/api/ph-address/barangays/0128',
]);

test('marks responses as publicly cacheable by browsers', function () {
    $response = $this->get(route('api.ph-address.provinces'))->assertOk();

    expect($response->headers->getCacheControlDirective('public'))->toBeTrue()
        ->and($response->headers->getCacheControlDirective('max-age'))->toBe('86400');
});

test('caches filtered results under a versioned key', function () {
    $this->get(route('api.ph-address.barangays', '012801'))->assertOk();

    expect(Cache::get('ph_address:v1:barangays:012801'))
        ->toBeArray()
        ->toContain(['name' => 'Adams (Pob.)', 'mun_code' => '012801']);
});
