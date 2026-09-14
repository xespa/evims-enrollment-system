<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;

class PhAddressController extends Controller
{
    public function provinces(): JsonResponse
    {
        $provinces = Cache::rememberForever('ph_address_provinces', function () {
            return json_decode(Storage::disk('local')->get('ph-address/provinces.json'), true);
        });

        usort($provinces, fn ($a, $b) => strcmp($a['name'], $b['name']));

        return response()->json($provinces);
    }

    public function cities(string $provinceCode): JsonResponse
    {
        $cities = Cache::rememberForever('ph_address_city_mun', function () {
            return json_decode(Storage::disk('local')->get('ph-address/city-mun.json'), true);
        });

        $filtered = array_values(array_filter($cities, fn ($c) => $c['prov_code'] === $provinceCode));
        usort($filtered, fn ($a, $b) => strcmp($a['name'], $b['name']));

        return response()->json($filtered);
    }

    public function barangays(string $munCode): JsonResponse
    {
        $barangays = Cache::rememberForever('ph_address_barangays', function () {
            return json_decode(Storage::disk('local')->get('ph-address/barangays.json'), true);
        });

        $filtered = array_values(array_filter($barangays, fn ($b) => $b['mun_code'] === $munCode));
        usort($filtered, fn ($a, $b) => strcmp($a['name'], $b['name']));

        return response()->json($filtered);
    }
}
