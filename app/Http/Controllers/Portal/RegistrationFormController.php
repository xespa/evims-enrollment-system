<?php

namespace App\Http\Controllers\Portal;

use App\Actions\Enrollment\GenerateRegistrationForm;
use App\Http\Controllers\Controller;
use App\Models\Enrollment;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

/**
 * Lets a parent download their child's registration form again, once the
 * application has been approved.
 */
class RegistrationFormController extends Controller
{
    public function __invoke(Enrollment $enrollment, GenerateRegistrationForm $registrationForm): Response
    {
        abort_unless($enrollment->enrollee_user_id === Auth::guard('enrollee')->id(), 403);
        abort_unless($enrollment->enrollment_status === 'APPROVED', 404);

        return $registrationForm->handle($enrollment)->download($registrationForm->filename($enrollment));
    }
}
