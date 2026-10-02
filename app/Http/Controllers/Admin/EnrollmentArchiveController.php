<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Enrollment;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

/**
 * Archiving hides an application from the admin's lists without deleting
 * anything — its documents, billing and payment records all stay intact.
 */
class EnrollmentArchiveController extends Controller
{
    public function store(Request $request, Enrollment $enrollment): RedirectResponse
    {
        /** @var User $admin Admin routes use the staff (web) guard. */
        $admin = $request->user();

        $enrollment->archive($admin);

        return redirect()
            ->route('admin.students.index')
            ->with('success', "Application for {$enrollment->student->first_name} {$enrollment->student->last_name} was archived.");
    }

    public function destroy(Enrollment $enrollment): RedirectResponse
    {
        $enrollment->restoreFromArchive();

        return back()->with('success', 'Application restored from the archive.');
    }
}
