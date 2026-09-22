<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use RuntimeException;

class PhAddressController extends Controller
{
    // Zip-code lookup names are matched after stripping these designation
    // tokens, so "City of San Fernando" and "San Fernando City" both
    // normalize to "SAN FERNANDO" and line up across the two datasets.
    private const IGNORED_NAME_TOKENS = ['CITY', 'OF', 'CPO'];

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

    /**
     * Suggest zip code(s) for a province + city/municipality pair, matched
     * against a community-sourced dataset (not the PSGC files above, which
     * don't carry zip codes). Coverage is partial, so an empty result just
     * means the frontend falls back to manual entry.
     */
    public function zipCodes(Request $request): JsonResponse
    {
        $city = trim((string) $request->query('city', ''));

        if ($city === '') {
            return response()->json([]);
        }

        $province = trim((string) $request->query('province', ''));
        $lookup = $this->zipCodeLookup();

        $provinceKey = $this->normalizeProvinceName($province);
        $cityKey = $this->normalizeName($city);

        $zips = $lookup['byProvinceCity']["{$provinceKey}|{$cityKey}"] ?? [];

        sort($zips);

        return response()->json(array_values($zips));
    }

    /**
     * @return array{byProvinceCity: array<string, string[]>}
     */
    private function zipCodeLookup(): array
    {
        return Cache::rememberForever('ph_address_zip_lookup', function () {
            $source = $this->loadJson('zip-codes.json', 'ph_address_zip_source');

            $byProvinceCity = [];

            foreach ($source as $provinces) {
                foreach ($provinces as $province => $cities) {
                    $provinceKey = $this->normalizeProvinceName($province);

                    foreach ($cities as $city => $zips) {
                        $cityKey = $this->normalizeName($city);

                        if ($cityKey === '') {
                            continue;
                        }

                        $key = "{$provinceKey}|{$cityKey}";
                        $byProvinceCity[$key] = array_values(array_unique(array_merge($byProvinceCity[$key] ?? [], $zips)));
                    }
                }
            }

            return compact('byProvinceCity');
        });
    }

    private function normalizeName(string $name): string
    {
        $name = strtoupper($name);
        $name = preg_replace('/\([^)]*\)/', ' ', $name);
        $name = preg_replace('/[^A-Z\s]/', ' ', $name);

        $tokens = array_filter(
            preg_split('/\s+/', $name),
            fn ($token) => $token !== '' && ! in_array($token, self::IGNORED_NAME_TOKENS, true),
        );

        return implode(' ', $tokens);
    }

    /**
     * PSGC splits Metro Manila into four "NCR, ... DISTRICT" provinces,
     * while the zip-code dataset groups every NCR city under one "Metro
     * Manila" province — align them so province+city matching still works
     * for NCR cities like Quezon City, Makati, Pasig, etc.
     */
    private function normalizeProvinceName(string $name): string
    {
        $key = $this->normalizeName($name);

        return str_starts_with($key, 'NCR') ? 'METRO MANILA' : $key;
    }
}
