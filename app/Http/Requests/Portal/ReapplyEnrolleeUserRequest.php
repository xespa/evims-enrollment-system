<?php

namespace App\Http\Requests\Portal;

use App\Enums\AccountStatus;
use App\Models\EnrolleeUser;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Support\Arr;

/**
 * Registering again after a rejection: the same fields as a new account,
 * except the email, which stays the one the link was sent to.
 */
class ReapplyEnrolleeUserRequest extends StoreEnrolleeUserRequest
{
    /**
     * Only an account that is still rejected can start over.
     */
    public function authorize(): bool
    {
        /** @var EnrolleeUser $enrolleeUser */
        $enrolleeUser = $this->route('enrolleeUser');

        return $enrolleeUser->account_status === AccountStatus::Rejected;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return Arr::except(parent::rules(), 'email');
    }
}
