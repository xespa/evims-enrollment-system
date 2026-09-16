<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;
use RuntimeException;

class PhAddressController extends Controller
{
    private function loadJson(string $filename, string $cacheKey): array
    {
        return Cache::rememberForever($cacheKey, function () use ($filename) {
            $path = storage_path("app/ph-address/{$filename}");

            if (! file_exists($path)) {
                throw new RuntimeException("PH address data file missing: {$path}");
            }

            $decoded = json_decode(file_get_contents($path), true);

            if (! is_array($decoded)) {
                throw new RuntimeException("PH address data file is empty or invalid JSON: {$path}");
            }

            return $decoded;
        });
    }

    public function provinces(): JsonResponse
    {
        $provinces = $this->loadJson('provinces.json', 'ph_address_provinces');
        usort($provinces, fn ($a, $b) => strcmp($a['name'], $b['name']));

        return response()->json($provinces);
    }

    public function cities(string $provinceCode): JsonResponse
    {
        $cities = $this->loadJson('city-mun.json', 'ph_address_city_mun');
        $filtered = array_values(array_filter($cities, fn ($c) => $c['prov_code'] === $provinceCode));
        usort($filtered, fn ($a, $b) => strcmp($a['name'], $b['name']));

        return response()->json($filtered);
    }

    public function barangays(string $munCode): JsonResponse
    {
        $barangays = $this->loadJson('barangays.json', 'ph_address_barangays');
        $filtered = array_values(array_filter($barangays, fn ($b) => $b['mun_code'] === $munCode));
        usort($filtered, fn ($a, $b) => strcmp($a['name'], $b['name']));

        return response()->json($filtered);
    }
}
