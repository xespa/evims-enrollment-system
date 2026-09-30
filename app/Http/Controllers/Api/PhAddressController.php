<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Closure;
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

    /**
     * Bump whenever the files in resources/data/ph-address change, so a
     * deploy starts from fresh cache entries instead of serving stale ones.
     */
    private const DATA_VERSION = 'v1';

    private const CACHE_TTL_DAYS = 30;

    private const BROWSER_MAX_AGE_SECONDS = 86400;

    public function provinces(): JsonResponse
    {
        $provinces = $this->remember('provinces', fn () => $this->sortByName(
            $this->loadRecords('provinces.json'),
        ));

        return $this->staticJson($provinces);
    }

    public function cities(string $provinceCode): JsonResponse
    {
        $cities = $this->remember("cities:{$provinceCode}", fn () => $this->sortByName(array_filter(
            $this->loadRecords('city-mun.json'),
            fn (array $city) => $city['prov_code'] === $provinceCode,
        )));

        return $this->staticJson($cities);
    }

    public function barangays(string $munCode): JsonResponse
    {
        $barangays = $this->remember("barangays:{$munCode}", fn () => $this->sortByName(array_filter(
            $this->loadRecords('barangays.json'),
            fn (array $barangay) => $barangay['mun_code'] === $munCode,
        )));

        return $this->staticJson($barangays);
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

        return $this->staticJson($zips);
    }

    /**
     * The zip-code index is small (one entry per province + city pair), so
     * it's cached whole rather than per lookup, which also keeps free-text
     * query strings from creating unbounded cache keys.
     *
     * @return array{byProvinceCity: array<string, string[]>}
     */
    private function zipCodeLookup(): array
    {
        return $this->remember('zip-code-index', function () {
            $source = $this->loadJson('zip-codes.json');

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

    /**
     * Cache small, already-filtered results under a versioned key. The raw
     * files are only read on a cache miss, so the full barangay dataset
     * never has to round-trip through the cache store.
     *
     * @template T
     *
     * @param  Closure(): T  $callback
     * @return T
     */
    private function remember(string $key, Closure $callback): mixed
    {
        return Cache::remember(
            'ph_address:'.self::DATA_VERSION.":{$key}",
            now()->addDays(self::CACHE_TTL_DAYS),
            $callback,
        );
    }

    /**
     * @return array<int|string, mixed>
     */
    private function loadJson(string $filename): array
    {
        $path = resource_path("data/ph-address/{$filename}");

        if (! file_exists($path)) {
            throw new RuntimeException("PH address data file missing: {$path}");
        }

        $contents = file_get_contents($path);
        $decoded = $contents === false ? null : json_decode($contents, true);

        if (! is_array($decoded)) {
            throw new RuntimeException("PH address data file is empty or invalid JSON: {$path}");
        }

        return $decoded;
    }

    /**
     * The province, city and barangay files are flat lists of string records.
     *
     * @return list<array<string, string>>
     */
    private function loadRecords(string $filename): array
    {
        /** @var list<array<string, string>> */
        return $this->loadJson($filename);
    }

    /**
     * @param  array<array-key, array<string, string>>  $items
     * @return list<array<string, string>>
     */
    private function sortByName(array $items): array
    {
        usort($items, fn (array $a, array $b) => strcmp($a['name'], $b['name']));

        return $items;
    }

    /**
     * The address data only changes on deploy, so browsers may reuse it.
     *
     * @param  array<int|string, mixed>  $data
     */
    private function staticJson(array $data): JsonResponse
    {
        return response()->json($data)
            ->setPublic()
            ->setMaxAge(self::BROWSER_MAX_AGE_SECONDS);
    }
}
