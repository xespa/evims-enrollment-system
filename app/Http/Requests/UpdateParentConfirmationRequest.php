<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * A parent's answer from the link emailed when their child created a
 * student portal account. The link itself is the authorization; the
 * controller checks it's still usable.
 */
class UpdateParentConfirmationRequest extends FormRequest
{
    public const CONFIRM = 'confirm';

    public const DECLINE = 'decline';

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
            'decision' => ['required', Rule::in([self::CONFIRM, self::DECLINE])],
        ];
    }

    public function confirmed(): bool
    {
        return $this->validated('decision') === self::CONFIRM;
    }
}
