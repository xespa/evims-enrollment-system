<?php

namespace App\Actions\GradeSheets;

use App\Actions\Enrollment\StoreEnrollmentDocument;
use App\Models\Curriculum;
use App\Models\Enrollment;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Sends a student's grades on to their next school year: that year's
 * Learner's Performance Report, made from every subject's grade sheet, is
 * put on the next application as its Form 138, already verified since the
 * school issued it.
 */
class SendGradesToNextApplication
{
    public function __construct(
        private GenerateGradeReport $generateGradeReport,
        private StoreEnrollmentDocument $storeDocument,
    ) {}

    /**
     * The approved students of the school year whose grades the staff member
     * can send on: those they grade who have applied for the next year.
     *
     * @return Builder<Enrollment>
     */
    public static function candidatesQuery(User $staff, string $schoolYear): Builder
    {
        return Enrollment::query()
            ->where('enrollments.school_year', $schoolYear)
            ->withStatus('APPROVED')
            ->archived(false)
            ->gradedBy($staff)
            ->appliedAgainFor(Curriculum::nextSchoolYear($schoolYear));
    }

    public function handle(Enrollment $enrollment, Enrollment $nextApplication, User $staff): void
    {
        $path = 'documents/'.Str::uuid().'.pdf';

        Storage::disk('public')->put(
            $path,
            $this->generateGradeReport->handle($enrollment->student, $enrollment->school_year)->output(),
        );

        $this->storeDocument->handle($nextApplication, 'form_138', $path, $staff, [
            'sent_from_school_year' => $enrollment->school_year,
        ]);
    }
}
