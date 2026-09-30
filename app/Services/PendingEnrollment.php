<?php

namespace App\Services;

use App\Actions\Enrollment\SubmitEnrollmentApplication;
use App\Models\EnrolleeUser;
use App\Models\Enrollment;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Storage;

/**
 * Holds a guest's fully validated admission application in their session
 * while they create an account (or log in), then submits it for them as
 * soon as they're authenticated — so nothing has to be re-entered and the
 * uploaded documents aren't lost along the way.
 */
class PendingEnrollment
{
    private const SESSION_KEY = 'pending_enrollment';

    private const PENDING_DIRECTORY = 'pending-documents';

    public function __construct(private SubmitEnrollmentApplication $submitApplication) {}

    /**
     * @param  array<string, mixed>  $validated
     */
    public function stash(Request $request, array $validated): void
    {
        // A second guest submission replaces the first rather than leaving
        // its uploads behind with nothing pointing at them.
        $this->discard();

        $request->session()->put(self::SESSION_KEY, [
            'data' => Arr::except($validated, array_keys(SubmitEnrollmentApplication::DOCUMENT_FIELDS)),
            'documents' => $this->submitApplication->storeDocuments($request, 'local', self::PENDING_DIRECTORY),
        ]);
    }

    public function exists(): bool
    {
        return session()->has(self::SESSION_KEY);
    }

    /**
     * Submits the stashed application on behalf of the newly authenticated
     * enrollee. Returns null when there's nothing waiting.
     */
    public function submitFor(EnrolleeUser $enrollee): ?Enrollment
    {
        $pending = session()->get(self::SESSION_KEY);

        if (! is_array($pending)) {
            return null;
        }

        /** @var array{form_138_path: ?string, birth_certificate_path: ?string, good_moral_path: ?string} $documentPaths */
        $documentPaths = array_map(
            fn (?string $path) => $path === null ? null : $this->moveToPublicDisk($path),
            $pending['documents'],
        );

        $enrollment = $this->submitApplication->handle($enrollee, $pending['data'], $documentPaths);

        session()->forget(self::SESSION_KEY);

        return $enrollment;
    }

    private function discard(): void
    {
        $pending = session()->pull(self::SESSION_KEY);

        if (! is_array($pending)) {
            return;
        }

        Storage::disk('local')->delete(array_filter($pending['documents']));
    }

    /**
     * Pending uploads sit on the private disk until they belong to a real
     * application, so a guest who never finishes signing up doesn't leave
     * publicly reachable files behind.
     */
    private function moveToPublicDisk(string $pendingPath): string
    {
        $publicPath = 'documents/'.basename($pendingPath);

        Storage::disk('public')->writeStream($publicPath, Storage::disk('local')->readStream($pendingPath));
        Storage::disk('local')->delete($pendingPath);

        return $publicPath;
    }
}
