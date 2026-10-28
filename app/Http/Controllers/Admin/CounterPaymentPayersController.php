<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Enrollment;
use Illuminate\Http\JsonResponse;

/**
 * The people the cashier can pick from as "Received from": the student's
 * father and mother (or their guardian) and the parent account holder.
 */
class CounterPaymentPayersController extends Controller
{
    public function __invoke(Enrollment $enrollment): JsonResponse
    {
        $enrollment->loadMissing('student.parentProfile', 'enrolleeUser');

        $profile = $enrollment->student->parentProfile;
        $candidates = [];

        if ($profile?->isGuardian()) {
            $candidates[] = [
                $this->fullName($profile->guardian_first_name, $profile->guardian_middle_name, $profile->guardian_last_name),
                $profile->guardian_relationship ?: 'Guardian',
            ];
        } elseif ($profile) {
            $candidates[] = [
                $this->fullName($profile->father_first_name, $profile->father_middle_name, $profile->father_last_name),
                'Father',
            ];
            $candidates[] = [
                $this->fullName($profile->mother_first_name, $profile->mother_middle_name, $profile->mother_maiden_last_name),
                'Mother',
            ];
        }

        $candidates[] = [$enrollment->enrolleeUser?->name, 'Account holder'];

        $payers = collect($candidates)
            ->filter(fn (array $candidate) => filled($candidate[0]))
            // The account holder is often the mother or father already listed.
            ->unique(fn (array $candidate) => mb_strtolower($candidate[0]))
            ->map(fn (array $candidate) => ['name' => $candidate[0], 'relationship' => $candidate[1]])
            ->values();

        return response()->json(['payers' => $payers]);
    }

    private function fullName(?string $first, ?string $middle, ?string $last): ?string
    {
        if (blank($first) || blank($last)) {
            return null;
        }

        return implode(' ', array_filter([
            $first,
            filled($middle) ? mb_substr($middle, 0, 1).'.' : null,
            $last,
        ]));
    }
}
