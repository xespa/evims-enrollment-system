<?php

namespace App\Concerns;

use Illuminate\Http\Request;

trait DetectsAdmissionIntent
{
    /**
     * Whether the visitor was sent here on their way to the admission form,
     * which needs an account first.
     */
    protected function isApplyingForAdmission(Request $request): bool
    {
        return str_starts_with((string) $request->session()->get('url.intended', ''), route('admission.create'));
    }
}
