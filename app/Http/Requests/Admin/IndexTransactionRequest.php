<?php

namespace App\Http\Requests\Admin;

use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * The Transactions page's tab and filters. Every filter is optional, and
 * they combine: only students matching all of them are listed.
 */
class IndexTransactionRequest extends FormRequest
{
    /** Students who have paid something. */
    public const TAB_PAID = 'PAID';

    /** Students with installments still owed that aren't due yet. */
    public const TAB_RECEIVABLE = 'RECEIVABLE';

    /** Students with installments still owed past their due date. */
    public const TAB_OVERDUE = 'OVERDUE';

    public const TABS = [self::TAB_PAID, self::TAB_RECEIVABLE, self::TAB_OVERDUE];

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
            'tab' => ['nullable', Rule::in(self::TABS)],
            'school_year' => ['nullable', 'string', 'regex:/^\d{4}-\d{4}$/'],
            'grade_level_id' => ['nullable', 'integer', Rule::exists('grade_levels', 'id')],
            'search' => ['nullable', 'string', 'max:100'],
        ];
    }

    public function tab(): string
    {
        return $this->validated('tab') ?? self::TAB_PAID;
    }
}
