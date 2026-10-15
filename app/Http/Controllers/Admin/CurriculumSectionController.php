<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateCurriculumSectionsRequest;
use App\Models\Curriculum;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;

/**
 * One grade level's sections for one school year, edited together: slots
 * changed, sections added, and empty ones removed.
 */
class CurriculumSectionController extends Controller
{
    public function update(UpdateCurriculumSectionsRequest $request, Curriculum $curriculum): RedirectResponse
    {
        /** @var list<array{id?: int|string|null, name: string, slots: int|string}> $sections */
        $sections = $request->validated('sections');

        DB::transaction(function () use ($curriculum, $sections) {
            $keptIds = array_filter(array_map(fn (array $section) => isset($section['id']) ? (int) $section['id'] : null, $sections));

            $curriculum->sections()->whereKeyNot($keptIds)->delete();

            foreach ($sections as $section) {
                $attributes = ['name' => trim($section['name']), 'slots' => (int) $section['slots']];

                isset($section['id'])
                    ? $curriculum->sections()->whereKey($section['id'])->update($attributes)
                    : $curriculum->sections()->create($attributes);
            }
        });

        $totalSlots = $curriculum->totalSlots();

        return back()->with('success', $totalSlots === null
            ? "{$curriculum->gradeLevel->name} has no sections for {$curriculum->school_year}, so there's no limit on applications."
            : "{$curriculum->gradeLevel->name}'s {$curriculum->school_year} sections saved: {$totalSlots} slots in all.");
    }
}
