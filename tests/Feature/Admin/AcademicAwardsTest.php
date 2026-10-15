<?php

use App\Actions\Awards\DetermineAcademicAwards;
use App\Actions\Awards\GenerateAwardList;
use App\Http\Requests\Admin\IndexAwardRequest;
use App\Models\Curriculum;
use App\Models\Enrollment;
use App\Models\GradeLevel;
use App\Models\GradeSheet;
use App\Models\Student;
use App\Models\StudentGrade;
use App\Models\Subject;
use App\Models\User;
use Illuminate\Support\Collection;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    // October 2026 falls in SY 2026-2027.
    $this->travelTo('2026-10-15');
});

/**
 * A grade level's 2026-2027 class with a grade sheet for each subject.
 *
 * @param  list<string>  $subjects
 * @return Collection<string, GradeSheet> The grade sheets, by subject name.
 */
function awardClass(string $gradeLevelName = 'Grade 5', array $subjects = ['English', 'Mathematics', 'Science']): Collection
{
    $curriculum = Curriculum::factory()->create([
        'grade_level_id' => GradeLevel::factory()->create(['name' => $gradeLevelName]),
        'school_year' => '2026-2027',
    ]);

    return collect($subjects)->mapWithKeys(fn (string $name) => [
        $name => GradeSheet::factory()->create([
            'subject_id' => Subject::factory()->create(['curriculum_id' => $curriculum->id, 'name' => $name]),
        ]),
    ]);
}

/**
 * An approved student in the class with the given grades per subject: a
 * number for the same grade every term, or the three term grades.
 *
 * @param  Collection<string, GradeSheet>  $gradeSheets
 * @param  array<string, int|list<int|null>>  $grades
 * @param  array<string, mixed>  $attributes
 */
function awardStudent(Collection $gradeSheets, array $grades, string $lastName = 'Cruz', array $attributes = []): Enrollment
{
    $curriculum = $gradeSheets->first()->subject->curriculum;

    $enrollment = Enrollment::factory()->create([
        'student_id' => Student::factory()->create(['last_name' => $lastName, 'first_name' => 'Ana', 'middle_name' => null]),
        'grade_level_id' => $curriculum->grade_level_id,
        'school_year' => $curriculum->school_year,
        'enrollment_status' => 'APPROVED',
        ...$attributes,
    ]);
    $enrollment->subjects()->attach($gradeSheets->map(fn (GradeSheet $gradeSheet) => $gradeSheet->subject_id)->values());

    foreach ($grades as $subject => $termGrades) {
        [$term1, $term2, $term3] = is_array($termGrades) ? $termGrades : [$termGrades, $termGrades, $termGrades];

        StudentGrade::factory()->for($gradeSheets[$subject])->create([
            'enrollment_id' => $enrollment->id,
            'term_1' => $term1,
            'term_2' => $term2,
            'term_3' => $term3,
        ]);
    }

    return $enrollment;
}

/**
 * The standing of one student, from the awards for 2026-2027.
 *
 * @return array<string, mixed>
 */
function standingOf(Enrollment $enrollment): array
{
    return collect(app(DetermineAcademicAwards::class)->handle('2026-2027'))
        ->flatMap(fn (array $gradeLevel) => $gradeLevel['students'])
        ->firstWhere('enrollment_id', $enrollment->id);
}

test('a general average of 90 with no grade below 80 earns the Academic Excellence Award', function () {
    $class = awardClass();
    $student = awardStudent($class, ['English' => 90, 'Mathematics' => 91, 'Science' => 89]);

    expect(standingOf($student))
        ->standing->toBe('ACADEMIC_EXCELLENCE')
        ->general_average->toBe(90)
        ->lowest_final_grade->toBe(89)
        ->reasons->toBe([])
        ->and(collect(standingOf($student)['awards'])->pluck('label')->all())->toContain('Academic Excellence Award');
});

test('final grades and the general average are rounded to whole numbers', function () {
    $class = awardClass();
    // English 89.67 → 90, Mathematics 89.33 → 89, Science 90: 89.67 → 90.
    $student = awardStudent($class, ['English' => [89, 90, 90], 'Mathematics' => [89, 89, 90], 'Science' => 90]);

    expect(standingOf($student))
        ->final_grades->toBe(['English' => 90, 'Mathematics' => 89, 'Science' => 90])
        ->general_average->toBe(90)
        ->standing->toBe('ACADEMIC_EXCELLENCE');
});

test('a general average below 90 misses the award, with the reason', function () {
    $student = awardStudent(awardClass(), ['English' => 89, 'Mathematics' => 89, 'Science' => 88]);

    expect(standingOf($student))
        ->standing->toBe('NOT_QUALIFIED')
        ->general_average->toBe(89)
        ->reasons->toBe(['General average 89 is below 90.'])
        ->awards->toBe([]);
});

test('a final grade below 80 misses the award even with a high average', function () {
    $student = awardStudent(awardClass(), ['English' => 99, 'Mathematics' => 98, 'Science' => 79]);

    expect(standingOf($student))
        ->standing->toBe('NOT_QUALIFIED')
        ->general_average->toBe(92)
        ->reasons->toBe(['Final grade below 80 in Science (79).']);
});

test('students with a learning area not fully graded are incomplete', function () {
    $student = awardStudent(awardClass(), ['English' => 95, 'Mathematics' => [95, 95, null]]);

    expect(standingOf($student))
        ->standing->toBe('INCOMPLETE')
        ->general_average->toBeNull()
        ->reasons->toBe(['No final grade yet in Mathematics, Science.']);
});

test('grades on an archived grade sheet don\'t count until it is restored', function () {
    $class = awardClass();
    $student = awardStudent($class, ['English' => 95, 'Mathematics' => 95, 'Science' => 95]);
    $class['Science']->archive($class['Science']->teacher);

    expect(standingOf($student))
        ->standing->toBe('INCOMPLETE')
        ->final_grades->toBe(['English' => 95, 'Mathematics' => 95, 'Science' => null]);

    $class['Science']->restoreFromArchive();

    expect(standingOf($student))->standing->toBe('ACADEMIC_EXCELLENCE');
});

test('the top final grade of 90 or higher in a learning area is recognized, ties included', function () {
    $class = awardClass();
    $topInMath = awardStudent($class, ['English' => 80, 'Mathematics' => 96, 'Science' => 85], 'Bautista');
    $tiedInMath = awardStudent($class, ['English' => 85, 'Mathematics' => 96, 'Science' => 86], 'Cruz');
    $topInEnglish = awardStudent($class, ['English' => 92, 'Mathematics' => 90, 'Science' => 87], 'Dela Rosa');

    $labels = fn (Enrollment $enrollment) => collect(standingOf($enrollment)['awards'])->pluck('label')->all();

    expect($labels($topInMath))->toBe(['Excellence in Mathematics'])
        ->and($labels($tiedInMath))->toBe(['Excellence in Mathematics'])
        ->and($labels($topInEnglish))->toBe(['Academic Excellence Award', 'Excellence in English'])
        // Science's top grade is 87, below 90, so nobody is recognized in it.
        ->and(collect([$topInMath, $tiedInMath, $topInEnglish])->flatMap($labels)->contains('Excellence in Science'))->toBeFalse();
});

test('Kindergarten to Grade 3 and other school years get no academic awards', function () {
    $grade3 = awardClass('Grade 3');
    awardStudent($grade3, ['English' => 99, 'Mathematics' => 99, 'Science' => 99]);
    awardStudent(awardClass('Nursery', ['Numeracy']), ['Numeracy' => 99]);
    $grade5 = awardClass();
    awardStudent($grade5, ['English' => 99, 'Mathematics' => 99, 'Science' => 99], attributes: ['school_year' => '2025-2026']);
    awardStudent($grade5, ['English' => 99, 'Mathematics' => 99, 'Science' => 99], attributes: ['enrollment_status' => 'PENDING']);

    $gradeLevels = app(DetermineAcademicAwards::class)->handle('2026-2027');

    expect(collect($gradeLevels)->pluck('name')->all())->toBe(['Grade 5'])
        ->and($gradeLevels[0]['students'])->toBe([]);
});

test('students are listed alphabetically, not ranked', function () {
    $class = awardClass();
    awardStudent($class, ['English' => 91, 'Mathematics' => 91, 'Science' => 91], 'Zamora');
    awardStudent($class, ['English' => 99, 'Mathematics' => 99, 'Science' => 99], 'Mendoza');
    awardStudent($class, ['English' => 95, 'Mathematics' => 95, 'Science' => 95], 'Abad');

    $names = collect(app(DetermineAcademicAwards::class)->handle('2026-2027')[0]['students'])->pluck('name')->all();

    expect($names)->toBe(['Abad, Ana', 'Mendoza, Ana', 'Zamora, Ana']);
});

test('a grade sheet shows its grade level\'s awards once the dialog asks for them', function () {
    $class = awardClass();
    $awardee = awardStudent($class, ['English' => 95, 'Mathematics' => 95, 'Science' => 95], 'Abad');
    awardStudent($class, ['English' => 85, 'Mathematics' => 85, 'Science' => 85], 'Cruz');
    awardStudent($class, ['English' => 85], 'Diaz');
    // Another grade level's student stays out.
    awardStudent(awardClass('Grade 6'), ['English' => 99, 'Mathematics' => 99, 'Science' => 99], 'Zamora');

    $this->actingAs($class['English']->teacher)
        ->get(route('admin.grade-sheets.show', $class['English']))
        ->assertInertia(fn (Assert $page) => $page
            ->where('showsAwards', true)
            ->missing('awards')
            ->has('awardCriteria', 2)
            ->where('recognitionOptions.0.value', 'RECOGNIZED')
            ->reloadOnly('awards', fn (Assert $reload) => $reload
                ->where('awards.school_year', '2026-2027')
                ->where('awards.grade_level', 'Grade 5')
                ->has('awards.students', 3)
                ->where('awards.students.0.enrollment_id', $awardee->id)
                ->where('awards.students.0.standing', 'ACADEMIC_EXCELLENCE')
                ->where('awards.summary.students', 3)
                ->where('awards.summary.academic_excellence', 1)
                ->where('awards.summary.not_qualified', 1)
                ->where('awards.summary.incomplete', 1)));
});

test('the recognition filter narrows the list', function (string $recognition, array $expectedNames) {
    $class = awardClass();
    awardStudent($class, ['English' => 95, 'Mathematics' => 95, 'Science' => 95], 'Abad');
    awardStudent($class, ['English' => 85, 'Mathematics' => 86, 'Science' => 85], 'Cruz');
    awardStudent($class, ['English' => 85], 'Diaz');

    $gradeLevels = DetermineAcademicAwards::onlyMatching(
        app(DetermineAcademicAwards::class)->handle('2026-2027'),
        fn (array $student): bool => IndexAwardRequest::matches($student, $recognition),
    );

    expect(collect($gradeLevels)->flatMap(fn ($gradeLevel) => collect($gradeLevel['students'])->pluck('name'))->all())
        ->toBe($expectedNames);
})->with([
    'academic excellence' => ['ACADEMIC_EXCELLENCE', ['Abad, Ana']],
    'learning area' => ['LEARNING_AREA_EXCELLENCE', ['Abad, Ana']],
    'missed academic excellence' => ['NOT_QUALIFIED', ['Cruz, Ana']],
    'incomplete grades' => ['INCOMPLETE', ['Diaz, Ana']],
    'everyone' => ['EVERYONE', ['Abad, Ana', 'Cruz, Ana', 'Diaz, Ana']],
]);

test('grade sheets below Grade 4 offer no awards', function () {
    $grade3 = awardClass('Grade 3');
    $teacher = $grade3['English']->teacher;

    $this->actingAs($teacher)
        ->get(route('admin.grade-sheets.show', $grade3['English']))
        ->assertInertia(fn (Assert $page) => $page
            ->where('showsAwards', false)
            ->reloadOnly('awards', fn (Assert $reload) => $reload->where('awards', null)));

    $this->get(route('admin.awards.print.show', ['grade_level_id' => $grade3->first()->subject->curriculum->grade_level_id]))
        ->assertSessionHasErrors(['grade_level_id' => 'Academic awards start at Grade 4.']);
});

test('the printed list can be narrowed to one grade level', function () {
    awardStudent(awardClass('Grade 5'), ['English' => 95, 'Mathematics' => 95, 'Science' => 95], 'Abad');
    $grade6 = awardClass('Grade 6');
    awardStudent($grade6, ['English' => 95, 'Mathematics' => 95, 'Science' => 95], 'Zamora');

    $html = view('pdf.award-list', app(GenerateAwardList::class)->viewData('2026-2027', DetermineAcademicAwards::onlyMatching(
        app(DetermineAcademicAwards::class)->handle('2026-2027', $grade6->first()->subject->curriculum->grade_level_id),
        fn (array $student): bool => IndexAwardRequest::matches($student, IndexAwardRequest::RECOGNIZED),
    )))->render();

    expect($html)->toContain('Zamora, Ana')->not->toContain('Abad, Ana');
});

test('the list of awardees prints as a pdf', function () {
    awardStudent(awardClass(), ['English' => 95, 'Mathematics' => 95, 'Science' => 95]);

    $this->actingAs(User::factory()->admin()->create())
        ->get(route('admin.awards.print.show', ['school_year' => '2026-2027']))
        ->assertOk()
        ->assertHeader('Content-Type', 'application/pdf')
        ->assertHeader('Content-Disposition', 'inline; filename=academic-awards-2026-2027.pdf');
});

test('the printed list names each awardee and their recognitions', function () {
    $class = awardClass();
    awardStudent($class, ['English' => 95, 'Mathematics' => 95, 'Science' => 95], 'Abad');
    awardStudent($class, ['English' => 85, 'Mathematics' => 85, 'Science' => 85], 'Cruz');

    $gradeLevels = DetermineAcademicAwards::onlyMatching(
        app(DetermineAcademicAwards::class)->handle('2026-2027'),
        fn (array $student): bool => IndexAwardRequest::matches($student, IndexAwardRequest::RECOGNIZED),
    );
    $html = view('pdf.award-list', app(GenerateAwardList::class)->viewData('2026-2027', $gradeLevels))->render();

    expect($html)->toContain('LIST OF ACADEMIC AWARDEES')
        ->toContain('Abad, Ana')
        ->toContain('Academic Excellence Award; Excellence in English')
        ->not->toContain('Cruz, Ana');
});

test('cashiers cannot print the awards', function () {
    $this->actingAs(User::factory()->cashier()->create());

    $this->get(route('admin.awards.print.show'))->assertForbidden();
});

test('an admin viewing a teacher\'s Grade 4+ sheet sees its awards', function () {
    $class = awardClass();

    $this->actingAs(User::factory()->admin()->create())
        ->get(route('admin.grade-sheets.show', $class['English']))
        ->assertInertia(fn (Assert $page) => $page->where('showsAwards', true));
});
