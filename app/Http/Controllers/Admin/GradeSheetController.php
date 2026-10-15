<?php

namespace App\Http\Controllers\Admin;

use App\Actions\GradeSheets\SendGradesToNextApplication;
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
use Illuminate\Support\Facades\DB;
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
            'archived' => ['sometimes', 'boolean'],
        ]);

        /** @var User $user */
        $user = $request->user();
        // Starts on the current school year; an empty value means every year.
        $schoolYear = Enrollment::filteredSchoolYear($request->has('school_year'), $validated['school_year'] ?? null);
        $showsArchive = $request->boolean('archived');

        $gradeSheets = GradeSheet::query()
            ->visibleTo($user)
            ->archived($showsArchive)
            ->when($schoolYear, fn ($query, string $schoolYear) => $query->forSchoolYear($schoolYear))
            ->with(GradeSheet::summaryRelations())
            ->withCount('studentGrades')
            ->when($showsArchive, fn ($query) => $query->latest('archived_at'))
            ->latest('id')
            ->paginate(15)
            ->withQueryString()
            ->through(fn (GradeSheet $gradeSheet) => [
                ...$gradeSheet->summary(),
                'students_count' => (int) $gradeSheet->getAttribute('student_grades_count'),
            ]);

        return Inertia::render('Admin/GradeSheets/Index', [
            'gradeSheets' => $gradeSheets,
            'schoolYears' => collect(Curriculum::schoolYears())
                ->push(Enrollment::currentSchoolYear())
                ->unique()
                ->sortDesc()
                ->values(),
            'filters' => ['school_year' => $schoolYear ?? '', 'archived' => $showsArchive],
            'archivedCount' => GradeSheet::query()->visibleTo($user)->archived()->count(),
            // Only teachers keep a list of subjects; null hides the panel.
            'mySubjects' => $user->role->canTeachSubjects() ? $this->taughtSubjects($user, $schoolYear) : null,
        ]);
    }

    /**
     * The teacher's subjects in published school years, each with how many
     * students take it and their grade sheet for it if they've made one.
     *
     * @return list<array{id: int, name: string, code: string|null, grade_level: string, school_year: string, enrolled_students_count: int, grade_sheet_id: int|null}>
     */
    private function taughtSubjects(User $teacher, ?string $schoolYear): array
    {
        $subjects = $teacher->taughtSubjects()
            ->whereIn('curriculum_id', Curriculum::query()
                ->published()
                ->when($schoolYear, fn ($query, string $schoolYear) => $query->forSchoolYear($schoolYear))
                ->select('id'))
            ->with('curriculum.gradeLevel')
            ->withEnrolledStudentsCount()
            ->get();

        $gradeSheetIds = GradeSheet::query()
            ->where('teacher_id', $teacher->id)
            ->whereIn('subject_id', $subjects->modelKeys())
            ->pluck('id', 'subject_id');

        return array_values($subjects
            ->sortBy([
                fn (Subject $a, Subject $b) => $b->curriculum->school_year <=> $a->curriculum->school_year,
                fn (Subject $a, Subject $b) => $a->curriculum->gradeLevel->level_order <=> $b->curriculum->gradeLevel->level_order,
                fn (Subject $a, Subject $b) => $a->name <=> $b->name,
            ])
            ->map(fn (Subject $subject) => [
                'id' => $subject->id,
                'name' => $subject->name,
                'code' => $subject->code,
                'grade_level' => $subject->curriculum->gradeLevel->name,
                'school_year' => $subject->curriculum->school_year,
                'enrolled_students_count' => (int) $subject->getAttribute('enrolled_students_count'),
                'grade_sheet_id' => $gradeSheetIds->get($subject->id),
            ])
            ->all());
    }

    public function create(Request $request): Response
    {
        Gate::authorize('create', GradeSheet::class);

        /** @var User $user */
        $user = $request->user();

        $subjects = Subject::query()
            ->whereIn('curriculum_id', Curriculum::query()->published()->select('id'))
            ->with([
                'curriculum.gradeLevel',
                'teachers:id',
                'gradeSheets' => fn ($query) => $query->visibleTo($user)->select(['id', 'subject_id', 'teacher_id', 'archived_at']),
            ])
            // The students a new sheet for it would start with.
            ->withEnrolledStudentsCount()
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
                // Who teaches it, so the list can narrow to the chosen
                // teacher's own subjects.
                'teacher_ids' => $subject->teachers->modelKeys(),
                // Sheets already made for it, so the form can point to the
                // chosen teacher's instead of letting them make another.
                'grade_sheets' => $subject->gradeSheets
                    ->map(fn (GradeSheet $gradeSheet) => [
                        'id' => $gradeSheet->id,
                        'number' => $gradeSheet->number,
                        'teacher_id' => $gradeSheet->teacher_id,
                        'archived' => $gradeSheet->isArchived(),
                    ])
                    ->values(),
                'enrolled_students_count' => (int) $subject->getAttribute('enrolled_students_count'),
            ])
            ->values();

        return Inertia::render('Admin/GradeSheets/Create', [
            'subjects' => $subjects,
            // From "Create grade sheet" next to one of the teacher's subjects.
            'selectedSubjectId' => $request->integer('subject_id') ?: null,
            // Who the chosen subject's new sheet would start with, to tick
            // or untick; reloaded on its own as the subject changes.
            'enrolledStudents' => fn () => Subject::query()
                ->whereIn('curriculum_id', Curriculum::query()->published()->select('id'))
                ->with('curriculum')
                ->find($request->integer('subject_id'))
                ?->enrolledStudents(),
            'schoolYears' => $subjects->pluck('school_year')->unique()->sortDesc()->values(),
            'defaultSchoolYear' => Enrollment::currentSchoolYear(),
            // A teacher's sheet is always their own, so only admins choose.
            'teachers' => $user->isAdmin()
                ? User::query()->active()->where('role', UserRole::Teacher)->orderBy('name')->get(['id', 'name'])
                : [],
            'currentTeacher' => $user->isAdmin() ? null : ['id' => $user->id, 'name' => $user->name],
        ]);
    }

    /**
     * Starts the sheet with the students enrolled in the subject already on
     * it (all of them, or the ones the teacher kept ticked), so the grades
     * can be typed straight into its table.
     */
    public function store(StoreGradeSheetRequest $request): RedirectResponse
    {
        $addsStudents = $request->boolean('add_students', true);
        $choseStudents = $request->has('enrollment_ids');

        [$gradeSheet, $addedCount] = DB::transaction(function () use ($request, $addsStudents, $choseStudents) {
            $gradeSheet = GradeSheet::create([
                ...$request->safe()->except(['add_students', 'enrollment_ids']),
                'created_by' => $request->user()?->id,
            ]);

            return [$gradeSheet, match (true) {
                ! $addsStudents => 0,
                $choseStudents => $gradeSheet->addStudents($request->validated('enrollment_ids', [])),
                default => $gradeSheet->addEveryUngradedStudent(),
            }];
        });

        return redirect()
            ->route('admin.grade-sheets.show', $gradeSheet)
            ->with('success', match (true) {
                $addedCount > 0 => "Grade sheet {$gradeSheet->number} created with ".($addedCount === 1 ? '1 student' : "{$addedCount} students").'. Click a term in the table to enter their grades.',
                ! $addsStudents || $choseStudents => "Grade sheet {$gradeSheet->number} created. Add its students when you're ready.",
                default => "Grade sheet {$gradeSheet->number} created. No approved students are taking this subject yet; add them once they are.",
            });
    }

    public function show(Request $request, GradeSheet $gradeSheet): Response
    {
        Gate::authorize('view', $gradeSheet);

        /** @var User $user */
        $user = $request->user();

        $gradeSheet->load(GradeSheet::summaryRelations());

        return Inertia::render('Admin/GradeSheets/Show', [
            'gradeSheet' => $gradeSheet->summary(),
            'studentGrades' => $gradeSheet->studentGradeRows(),
            // Offered in "Add students", to add several (or all) at once.
            // None while archived, since the sheet can't be changed.
            'ungradedStudents' => $gradeSheet->isArchived() ? [] : $gradeSheet->ungradedStudents(),
            // The sheet's students who applied for the next school year, to
            // send their report card on as its Form 138. Null while archived.
            'sendGrades' => fn () => $gradeSheet->isArchived() || ! $user->can('upload-document', 'form_138')
                ? null
                : SendGradesToNextApplication::forGradeSheet($gradeSheet, $user),
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
}
