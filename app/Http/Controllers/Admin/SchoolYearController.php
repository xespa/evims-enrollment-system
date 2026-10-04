<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Curriculum;
use App\Models\Enrollment;
use App\Models\EnrollmentPeriod;
use App\Models\GradeLevel;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

/**
 * Setting up a new school year is a draft → save / cancel flow: the copy is
 * reviewed and edited first, and parents can only apply once it's saved.
 */
class SchoolYearController extends Controller
{
    /**
     * Starts a draft of the next school year by copying every grade level's
     * fees and subjects from the latest year, so only what changed needs
     * editing. Years are set up one at a time, in order.
     */
    public function store(Request $request): RedirectResponse
    {
        if ($draft = Curriculum::draftSchoolYear()) {
            throw ValidationException::withMessages([
                'school_year' => "Finish setting up {$draft} first: save it or cancel it.",
            ]);
        }

        $schoolYears = Curriculum::schoolYears();
        $latestSchoolYear = end($schoolYears) ?: null;
        $nextSchoolYear = $latestSchoolYear
            ? Curriculum::nextSchoolYear($latestSchoolYear)
            : Enrollment::currentSchoolYear();

        $validated = $request->validate([
            'school_year' => ['required', 'string', Rule::in([$nextSchoolYear])],
        ], [
            'school_year.in' => "The next school year to set up is {$nextSchoolYear}.",
        ]);

        $period = DB::transaction(function () use ($validated, $latestSchoolYear) {
            foreach (GradeLevel::orderBy('level_order')->get() as $gradeLevel) {
                $source = $latestSchoolYear
                    ? $gradeLevel->curricula()->with('subjects')->orderByDesc('school_year')->first()
                    : null;

                $curriculum = $gradeLevel->curricula()->create([
                    'school_year' => $validated['school_year'],
                    'is_draft' => true,
                    ...($source ? Arr::only($source->getAttributes(), Curriculum::FEE_FIELDS) : []),
                ]);

                foreach ($source ? $source->subjects : [] as $subject) {
                    $curriculum->subjects()->create($subject->only(['name', 'code']));
                }
            }

            return $latestSchoolYear ? $this->copyEnrollmentPeriod($latestSchoolYear, $validated['school_year']) : null;
        });

        $message = $latestSchoolYear
            ? "Draft of {$validated['school_year']} created from {$latestSchoolYear}. Review its fees and subjects, then save it to open enrollment."
            : "Draft of {$validated['school_year']} created. Add its fees and subjects, then save it to open enrollment.";

        if ($period) {
            $message .= " Its enrollment dates were carried over a year later ({$period->opens_on->format('M j, Y')} to {$period->closes_on->format('M j, Y')}); change them if needed.";
        }

        return to_route('admin.grade-levels.index', ['school_year' => $validated['school_year']])
            ->with('success', $message);
    }

    /**
     * Saves the draft: the school year opens for enrollment.
     */
    public function update(string $schoolYear): RedirectResponse
    {
        $this->draftCurricula($schoolYear)->update(['is_draft' => false]);

        return to_route('admin.grade-levels.index', ['school_year' => $schoolYear])
            ->with('success', "{$schoolYear} is saved and open for enrollment.");
    }

    /**
     * Cancels the draft: its fees, subjects and enrollment dates are
     * discarded. Nobody can have applied for it, since drafts aren't
     * offered to applicants.
     */
    public function destroy(string $schoolYear): RedirectResponse
    {
        $draftCurricula = $this->draftCurricula($schoolYear);

        DB::transaction(function () use ($draftCurricula, $schoolYear) {
            $draftCurricula->delete();
            EnrollmentPeriod::query()->where('school_year', $schoolYear)->delete();
        });

        return to_route('admin.grade-levels.index')
            ->with('success', "Setting up {$schoolYear} was cancelled. Nothing was changed.");
    }

    /**
     * Gives the new school year the same enrollment dates as the one it was
     * copied from, a year later (Feb 29 becomes Feb 28). Nothing is copied
     * when that year has no dates.
     */
    private function copyEnrollmentPeriod(string $fromSchoolYear, string $toSchoolYear): ?EnrollmentPeriod
    {
        $source = EnrollmentPeriod::query()->where('school_year', $fromSchoolYear)->first();

        if (! $source) {
            return null;
        }

        return EnrollmentPeriod::create([
            'school_year' => $toSchoolYear,
            'opens_on' => $source->opens_on->addYearNoOverflow(),
            'closes_on' => $source->closes_on->addYearNoOverflow(),
        ]);
    }

    /**
     * The draft school year's curricula; 404 if that year isn't a draft
     * (already saved, or never set up).
     *
     * @return Builder<Curriculum>
     */
    private function draftCurricula(string $schoolYear): Builder
    {
        $query = Curriculum::query()->forSchoolYear($schoolYear)->where('is_draft', true);

        abort_unless($query->exists(), 404);

        return $query;
    }
}
