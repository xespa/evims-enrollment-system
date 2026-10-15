<?php

namespace App\Http\Controllers\Admin;

use App\Actions\Enrollment\StoreEnrollmentDocument;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreEnrollmentDocumentRequest;
use App\Models\Enrollment;
use App\Models\User;
use Illuminate\Http\RedirectResponse;

class EnrollmentDocumentController extends Controller
{
    /**
     * Uploads (or replaces) a document on the parent's behalf — e.g. a
     * returning student's report card, which the school itself issues.
     * The registrar has the original in hand, so it counts as verified.
     */
    public function store(StoreEnrollmentDocumentRequest $request, Enrollment $enrollment, string $type, StoreEnrollmentDocument $storeDocument): RedirectResponse
    {
        /** @var User $admin Admin routes use the staff (web) guard. */
        $admin = $request->user();

        $path = $request->file('file')->store('documents', 'public');

        abort_if($path === false, 500, 'The document could not be saved.');

        $storeDocument->handle($enrollment, $type, $path, $admin);

        return back()->with('success', 'Document uploaded and marked as verified.');
    }
}
