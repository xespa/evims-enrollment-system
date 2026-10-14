<?php

namespace App\Http\Requests\Admin;

use App\Enums\AccountStatus;
use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

/**
 * An admin approving or rejecting a staff account request. Access is
 * checked by the route's can:manage-staff middleware.
 */
class UpdateStaffAccountApprovalRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'account_status' => ['required', Rule::enum(AccountStatus::class)->only([AccountStatus::Approved, AccountStatus::Rejected])],
        ];
    }

    /**
     * Only requests still waiting on a decision can be decided.
     *
     * @return array<int, callable(Validator): void>
     */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                /** @var User $staffAccount */
                $staffAccount = $this->route('staffAccount');

                if (! $staffAccount->isAwaitingApproval()) {
                    $validator->errors()->add('staff_account', "{$staffAccount->name}'s account isn't waiting for approval.");
                }
            },
        ];
    }
}
