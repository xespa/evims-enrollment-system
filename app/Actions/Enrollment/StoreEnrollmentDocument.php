<?php

namespace App\Actions\Enrollment;

use App\Enums\AuditAction;
use App\Models\AuditLog;
use App\Models\Enrollment;
use App\Models\OfficeVerification;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

/**
 * Puts a document the school provides on an application, replacing any
 * earlier file: e.g. a returning student's report card, which the school
 * itself issues, so it counts as verified.
 */
class StoreEnrollmentDocument
{
    /**
     * @param  string  $type  A key of OfficeVerification::DOCUMENT_COLUMNS.
     * @param  string  $path  The file, already stored on the public disk.
     * @param  array<string, mixed>  $auditDetails  Extra details for the audit log.
     */
    public function handle(Enrollment $enrollment, string $type, string $path, User $staff, array $auditDetails = []): void
    {
        $columns = OfficeVerification::DOCUMENT_COLUMNS[$type];
        $verification = $enrollment->officeVerification()->firstOrCreate([]);
        $previousPath = $verification->{$columns['path']};

        DB::transaction(function () use ($verification, $columns, $path, $staff, $enrollment, $type, $previousPath, $auditDetails): void {
            $verification->update([
                $columns['path'] => $path,
                $columns['verified'] => true,
                'verified_by' => $staff->id,
                'verified_at' => now(),
            ]);

            AuditLog::record(AuditAction::DocumentUploaded, $enrollment, [
                'document' => $type,
                'replaced' => $previousPath !== null,
                ...$auditDetails,
            ], $staff);
        });

        if ($previousPath && $previousPath !== $path) {
            Storage::disk('public')->delete($previousPath);
        }
    }
}
