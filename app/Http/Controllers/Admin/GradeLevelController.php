<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Curriculum;
use App\Models\Enrollment;
use App\Models\EnrollmentPeriod;
use App\Models\GradeLevel;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class GradeLevelController extends Controller
{
    /**
     * Each grade level's fees and subjects for one school year at a time.
     * Both are edited in modals on this page, so the subjects ship along.
     */
    public function index(Request $request): Response
    {
        $schoolYears = Curriculum::schoolYears();
        $schoolYear = $this->selectedSchoolYear($request->string('school_year')->toString(), $schoolYears);

        $enrollmentCounts = Enrollment::query()
            ->where('school_year', $schoolYear)
            ->selectRaw('grade_level_id, count(*) as count')
            ->groupBy('grade_level_id')
            ->pluck('count', 'grade_level_id');

        $gradeLevels = GradeLevel::query()
            ->with(['curricula' => fn ($query) => $query
                ->forSchoolYear($schoolYear)
                ->with(['subjects' => fn ($query) => $query
                    ->select(['id', 'curriculum_id', 'name', 'code'])
                    ->withCount('enrollments')
                    ->orderBy('name')])])
            ->orderBy('level_order')
            ->get()
            ->map(fn (GradeLevel $gradeLevel) => [
                'id' => $gradeLevel->id,
                'name' => $gradeLevel->name,
                'level_order' => $gradeLevel->level_order,
                'curriculum' => $gradeLevel->curricula->first()?->setAttribute(
                    'enrollments_count',
                    (int) ($enrollmentCounts[$gradeLevel->id] ?? 0),
                ),
            ]);

        $latestSchoolYear = end($schoolYears) ?: null;

        return Inertia::render('Admin/GradeLevels/Index', [
            'gradeLevels' => $gradeLevels,
            'schoolYear' => $schoolYear,
            'schoolYears' => $schoolYears,
            'currentSchoolYear' => Enrollment::currentSchoolYear(),
            // A newly set-up year awaiting Save or Cancel; hidden from
            // applicants until saved.
            'draftSchoolYear' => Curriculum::draftSchoolYear(),
            // When applications for the selected year open and close; null
            // when no dates are set.
            'enrollmentPeriod' => EnrollmentPeriod::query()
                ->where('school_year', $schoolYear)
                ->first(['opens_on', 'closes_on'])
                ?->toArray(),
            'today' => EnrollmentPeriod::today()->toDateString(),
            // The only year that can be set up next: the one after the
            // latest, copied from it.
            'nextSchoolYear' => $latestSchoolYear
                ? Curriculum::nextSchoolYear($latestSchoolYear)
                : Enrollment::currentSchoolYear(),
            // Lets a link (or the old per-grade page URL) open a grade
            // level's Manage Subjects modal directly.
            'manageGradeLevelId' => $request->integer('manage') ?: null,
        ]);
    }

    /**
     * Subjects used to live on their own page; keep old links working by
     * opening that grade level's subjects modal instead.
     */
    public function show(GradeLevel $gradeLevel): RedirectResponse
    {
        return to_route('admin.grade-levels.index', ['manage' => $gradeLevel->id]);
    }

    /**
     * The requested year if it's been set up, otherwise the current school
     * year, otherwise the latest one that exists.
     *
     * @param  list<string>  $schoolYears
     */
    private function selectedSchoolYear(string $requested, array $schoolYears): string
    {
        $current = Enrollment::currentSchoolYear();

        if (in_array($requested, $schoolYears, true)) {
            return $requested;
        }

        if (in_array($current, $schoolYears, true) || $schoolYears === []) {
            return $current;
        }

        return end($schoolYears);
    }
}
