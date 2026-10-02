<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\EnrolleeUser;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class EnrolleeAccountValidIdController extends Controller
{
    /**
     * Shows the valid ID a parent attached when registering. It lives on the
     * private disk, so this is the only way to see it.
     */
    public function __invoke(EnrolleeUser $enrolleeUser): StreamedResponse
    {
        Gate::authorize('view', $enrolleeUser);

        abort_unless(
            $enrolleeUser->valid_id_path && Storage::disk('local')->exists($enrolleeUser->valid_id_path),
            404,
        );

        return Storage::disk('local')->response($enrolleeUser->valid_id_path, headers: [
            'Cache-Control' => 'private, no-store',
        ]);
    }
}
