<?php

namespace App\Http\Controllers\Admin;

use App\Actions\Enrollment\GenerateRegistrationForm;
use App\Http\Controllers\Controller;
use App\Models\Enrollment;
use Symfony\Component\HttpFoundation\Response;

/**
 * The same registration form the family was emailed, for staff to print or
 * resend by hand.
 */
class RegistrationFormController extends Controller
{
    public function __invoke(Enrollment $enrollment, GenerateRegistrationForm $registrationForm): Response
    {
        abort_unless($enrollment->enrollment_status === 'APPROVED', 404);

        return $registrationForm->handle($enrollment)->download($registrationForm->filename($enrollment));
    }
}
