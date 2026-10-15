<?php

namespace App\Http\Controllers\Admin;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreGradeSheetRequest;
use App\Http\Requests\Admin\UpdateGradeSheetRequest;
use App\Models\Curriculum;
use App\Models\Enrollment;
use App\Models\GradeSheet;
use App\Models\Subject;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Teachers' grade sheets: one per subject, listing each student's three
 * term grades. A teacher sees their own; an admin sees every teacher's.
 */
class GradeSheetController extends Controller
{
    public function index(Request $request): Response
    {
        Gate::authorize('viewAny', GradeSheet::class);

        $validated = $request->validate([
            'school_year' => ['nullable', 'string', 'regex:/^\d{4}-\d{4}$/'],
        ]);

        /** @var User $user */
        $user = $request->user();
        $schoolYear = $validated['school_year'] ?? null;

        $gradeSheets = GradeSheet::query()
            ->visibleTo($user)
            ->when($schoolYear, fn ($query, string $schoolYear) => $query->forSchoolYear($schoolYear))
            ->with(GradeSheet::summaryRelations())
            ->withCount('studentGrades')
            ->latest('id')
            ->paginate(15)
            ->withQueryString()
            ->through(fn (GradeSheet $gradeSheet) => [
                ...$gradeSheet->summary(),
                'students_count' => (int) $gradeSheet->getAttribute('student_grades_count'),
            ]);

        return Inertia::render('Admin/GradeSheets/Index', [
            'gradeSheets' => $gradeSheets,
            'schoolYears' => array_reverse(Curriculum::schoolYears()),
            'filters' => ['school_year' => $schoolYear ?? ''],
        ]);
    }

    public function create(Request $request): Response
    {
        Gate::authorize('create', GradeSheet::class);

        /** @var User $user */
        $user = $request->user();

        $subjects = Subject::query()
            ->whereIn('curriculum_id', Curriculum::query()->published()->select('id'))
            ->with('curriculum.gradeLevel')
            ->get()
            ->sortBy([
                fn (Subject $a, Subject $b) => $a->curriculum->gradeLevel->level_order <=> $b->curriculum->gradeLevel->level_order,
                fn (Subject $a, Subject $b) => $a->name <=> $b->name,
            ])
            ->map(fn (Subject $subject) => [
                'id' => $subject->id,
                'name' => $subject->name,
                'code' => $subject->code,
                'grade_level' => $subject->curriculum->gradeLevel->name,
                'school_year' => $subject->curriculum->school_year,
            ])
            ->values();

        return Inertia::render('Admin/GradeSheets/Create', [
            'subjects' => $subjects,
            'schoolYears' => $subjects->pluck('school_year')->unique()->sortDesc()->values(),
            'defaultSchoolYear' => Enrollment::max('school_year') ?? Enrollment::currentSchoolYear(),
            // A teacher's sheet is always their own, so only admins choose.
            'teachers' => $user->isAdmin()
                ? User::query()->active()->where('role', UserRole::Teacher)->orderBy('name')->get(['id', 'name'])
                : [],
            'currentTeacher' => $user->isAdmin() ? null : ['id' => $user->id, 'name' => $user->name],
        ]);
    }

    /**
     * Starts the sheet, then goes straight to adding its first student.
     */
    public function store(StoreGradeSheetRequest $request): RedirectResponse
    {
        $gradeSheet = GradeSheet::create($request->validated());

        return redirect()
            ->route('admin.grade-sheets.student-grades.create', $gradeSheet)
            ->with('success', "Grade sheet {$gradeSheet->number} created. Add your first student.");
    }

    public function show(GradeSheet $gradeSheet): Response
    {
        Gate::authorize('view', $gradeSheet);

        $gradeSheet->load(GradeSheet::summaryRelations());

        return Inertia::render('Admin/GradeSheets/Show', [
            'gradeSheet' => $gradeSheet->summary(),
            'studentGrades' => $gradeSheet->studentGradeRows(),
            // Offered in "Add students", to add several (or all) at once.
            'ungradedStudents' => $gradeSheet->ungradedStudents(),
        ]);
    }

    /**
     * Sets when the class meets; the subject and teacher can't change.
     */
    public function update(UpdateGradeSheetRequest $request, GradeSheet $gradeSheet): RedirectResponse
    {
        $gradeSheet->update($request->validated());

        return redirect()
            ->route('admin.grade-sheets.show', $gradeSheet)
            ->with('success', 'Schedule saved.');
    }

    public function destroy(GradeSheet $gradeSheet): RedirectResponse
    {
        Gate::authorize('delete', $gradeSheet);

        $gradeSheet->delete();

        return redirect()
            ->route('admin.grade-sheets.index')
            ->with('success', "Grade sheet {$gradeSheet->number} deleted.");
    }
}
