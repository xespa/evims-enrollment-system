<?php

namespace App\Http\Requests\Admin;

use App\Enums\AccountRejectionReason;
use App\Enums\AccountStatus;
use App\Models\EnrolleeUser;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class UpdateEnrolleeAccountRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        /** @var EnrolleeUser $enrolleeUser */
        $enrolleeUser = $this->route('enrolleeUser');

        return (bool) $this->user()?->can('update', $enrolleeUser);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'account_status' => [
                'required',
                Rule::enum(AccountStatus::class)->only([AccountStatus::Approved, AccountStatus::Rejected]),
            ],
            'rejection_reasons' => [
                Rule::requiredIf($this->isRejecting()),
                Rule::prohibitedIf(! $this->isRejecting()),
                'array',
                'min:1',
            ],
            'rejection_reasons.*' => ['distinct', Rule::enum(AccountRejectionReason::class)],
            // The admin's own note — required when none of the listed
            // reasons covers it.
            'rejection_reason' => [
                Rule::requiredIf($this->isRejecting() && in_array(AccountRejectionReason::Other->value, (array) $this->input('rejection_reasons', []), true)),
                'nullable',
                'string',
                'min:5',
                'max:500',
            ],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'rejection_reasons.required' => 'Pick at least one reason — the account holder is emailed what to fix.',
            'rejection_reasons.min' => 'Pick at least one reason — the account holder is emailed what to fix.',
            'rejection_reason.required' => 'Explain the other reason — the account holder sees this note.',
        ];
    }

    /**
     * An account can't be approved until its owner has confirmed their
     * email — otherwise the school has no proven way to reach them.
     *
     * @return array<int, callable>
     */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                /** @var EnrolleeUser $enrolleeUser */
                $enrolleeUser = $this->route('enrolleeUser');

                if ($this->input('account_status') === AccountStatus::Approved->value && ! $enrolleeUser->hasVerifiedEmail()) {
                    $validator->errors()->add(
                        'account_status',
                        "{$enrolleeUser->name} hasn't confirmed their email yet, so the account can't be approved. Try again once they've clicked the link we emailed them.",
                    );
                }
            },
        ];
    }

    private function isRejecting(): bool
    {
        return $this->input('account_status') === AccountStatus::Rejected->value;
    }
}
