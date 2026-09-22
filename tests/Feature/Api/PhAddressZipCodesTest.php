<?php

test('returns the zip code for a matching province and city', function () {
    $this->get(route('api.ph-address.zip-codes', [
        'province' => 'Pangasinan',
        'city' => 'San Carlos City',
    ]))
        ->assertOk()
        ->assertExactJson(['2420']);
});

test('matches ncr cities despite the psgc district province naming', function () {
    $this->get(route('api.ph-address.zip-codes', [
        'province' => 'NCR, Second District',
        'city' => 'Quezon City',
    ]))
        ->assertOk()
        ->assertExactJson(['1100']);
});

test('returns an empty array when there is no match', function () {
    $this->get(route('api.ph-address.zip-codes', [
        'province' => 'Not A Real Province',
        'city' => 'Not A Real City',
    ]))
        ->assertOk()
        ->assertExactJson([]);
});

test('returns an empty array when city is missing', function () {
    $this->get(route('api.ph-address.zip-codes', ['province' => 'Pangasinan']))
        ->assertOk()
        ->assertExactJson([]);
});

test('does not fall back to a same-named city in a different province', function () {
    // "Mercedes" exists in both Camarines Norte (4601) and Eastern Samar
    // (6808) — two different towns that happen to share a name. Selecting
    // Eastern Samar's Mercedes must never return Camarines Norte's zip
    // code just because the name matches.
    $this->get(route('api.ph-address.zip-codes', [
        'province' => 'Eastern Samar',
        'city' => 'Mercedes',
    ]))
        ->assertOk()
        ->assertExactJson(['6808']);

    $this->get(route('api.ph-address.zip-codes', [
        'province' => 'Camarines Norte',
        'city' => 'Mercedes',
    ]))
        ->assertOk()
        ->assertExactJson(['4601']);
});
