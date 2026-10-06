<?php

namespace App\Http\Controllers\Admin;

use App\Enums\AuditAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreEnrollmentDocumentRequest;
use App\Models\AuditLog;
use App\Models\Enrollment;
use App\Models\OfficeVerification;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class EnrollmentDocumentController extends Controller
{
    /**
     * Uploads (or replaces) a document on the parent's behalf — e.g. a
     * returning student's report card, which the school itself issues.
     * The registrar has the original in hand, so it counts as verified.
     */
    public function store(StoreEnrollmentDocumentRequest $request, Enrollment $enrollment, string $type): RedirectResponse
    {
        /** @var User $admin Admin routes use the staff (web) guard. */
        $admin = $request->user();

        $columns = OfficeVerification::DOCUMENT_COLUMNS[$type];
        $verification = $enrollment->officeVerification()->firstOrCreate([]);
        $previousPath = $verification->{$columns['path']};

        DB::transaction(function () use ($verification, $columns, $request, $admin, $enrollment, $type, $previousPath): void {
            $verification->update([
                $columns['path'] => $request->file('file')->store('documents', 'public'),
                $columns['verified'] => true,
                'verified_by' => $admin->id,
                'verified_at' => now(),
            ]);

            AuditLog::record(AuditAction::DocumentUploaded, $enrollment, [
                'document' => $type,
                'replaced' => $previousPath !== null,
            ]);
        });

        if ($previousPath) {
            Storage::disk('public')->delete($previousPath);
        }

        return back()->with('success', 'Document uploaded and marked as verified.');
    }
}
