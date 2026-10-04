<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateEnrollmentPeriodRequest;
use App\Models\Curriculum;
use App\Models\EnrollmentPeriod;
use Illuminate\Http\RedirectResponse;

/**
 * Sets when applications for a school year open and close. Without a
 * period, a saved school year is open for as long as it's the newest.
 */
class EnrollmentPeriodController extends Controller
{
    public function update(UpdateEnrollmentPeriodRequest $request, string $schoolYear): RedirectResponse
    {
        $this->ensureSchoolYearExists($schoolYear);

        $period = EnrollmentPeriod::firstOrNew(['school_year' => $schoolYear]);
        $wasClosed = $period->exists && $period->isClosed();
        $period->fill($request->validated())->save();

        $opensOn = $period->opens_on->format('M j, Y');
        $closesOn = $period->closes_on->format('M j, Y');

        $message = $wasClosed && $period->isOpen()
            ? "Enrollment for {$schoolYear} is reopened until {$closesOn}."
            : "Enrollment for {$schoolYear} is set from {$opensOn} to {$closesOn}.";

        return to_route('admin.grade-levels.index', ['school_year' => $schoolYear])
            ->with('success', $message);
    }

    /**
     * Removes the dates: the school year is open whenever it's saved and
     * the newest, as before any dates were set.
     */
    public function destroy(string $schoolYear): RedirectResponse
    {
        $this->ensureSchoolYearExists($schoolYear);

        EnrollmentPeriod::query()->where('school_year', $schoolYear)->delete();

        return to_route('admin.grade-levels.index', ['school_year' => $schoolYear])
            ->with('success', "The enrollment dates for {$schoolYear} were removed.");
    }

    private function ensureSchoolYearExists(string $schoolYear): void
    {
        abort_unless(Curriculum::query()->forSchoolYear($schoolYear)->exists(), 404);
    }
}
