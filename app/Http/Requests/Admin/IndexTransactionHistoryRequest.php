<?php

namespace App\Http\Requests\Admin;

use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Filters for the full payment history. Every filter is optional, and
 * they combine: only payments matching all of them are listed.
 */
class IndexTransactionHistoryRequest extends FormRequest
{
    /**
     * Payments that took money: completed ones, and voided ones (taken,
     * then reversed). Pending and failed GCash attempts never did.
     */
    public const STATUSES = ['COMPLETED', 'VOIDED'];

    public const METHODS = ['GCASH', 'CASH'];

    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user() instanceof User;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'status' => ['nullable', Rule::in(self::STATUSES)],
            'method' => ['nullable', Rule::in(self::METHODS)],
            'school_year' => ['nullable', 'string', 'regex:/^\d{4}-\d{4}$/'],
            'grade_level_id' => ['nullable', 'integer', Rule::exists('grade_levels', 'id')],
            'search' => ['nullable', 'string', 'max:100'],
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date', 'after_or_equal:from'],
        ];
    }
}
