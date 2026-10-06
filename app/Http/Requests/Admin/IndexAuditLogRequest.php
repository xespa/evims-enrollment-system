<?php

namespace App\Http\Requests\Admin;

use App\Enums\AuditAction;
use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class IndexAuditLogRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        return $user instanceof User && $user->can('manage-staff');
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'action' => ['nullable', Rule::enum(AuditAction::class)],
            'user_id' => ['nullable', 'integer', Rule::exists(User::class, 'id')],
        ];
    }
}
