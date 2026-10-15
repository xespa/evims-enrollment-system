<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateEnrollmentSectionRequest;
use App\Models\Enrollment;
use Illuminate\Http\RedirectResponse;

/**
 * Staff place an approved student in one of their grade level's sections.
 */
class EnrollmentSectionController extends Controller
{
    public function update(UpdateEnrollmentSectionRequest $request, Enrollment $enrollment): RedirectResponse
    {
        $enrollment->section()->associate($request->validated('section_id'));
        $enrollment->save();

        $section = $enrollment->section;

        return back()->with('success', $section
            ? "Placed in Section {$section->name}."
            : 'Removed from their section.');
    }
}
