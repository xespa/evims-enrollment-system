<?php

namespace App\Http\Requests\Portal;

use App\Enums\PaymentMethod;
use App\Models\Enrollment;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class UpdatePaymentMethodRequest extends FormRequest
{
    /**
     * Only the parent who applied can choose how an approved, still-active
     * application's tuition is paid online.
     */
    public function authorize(): bool
    {
        /** @var Enrollment $enrollment */
        $enrollment = $this->route('enrollment');

        return $enrollment->enrollee_user_id === $this->user('enrollee')?->getAuthIdentifier()
            && $enrollment->enrollment_status === 'APPROVED'
            && ! $enrollment->isCancelled()
            && $enrollment->billingContract !== null;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'payment_channel' => ['required', Rule::in(PaymentMethod::choosableValues())],
        ];
    }

    /**
     * A fully paid bill has nothing left to pay, by either method.
     *
     * @return array<int, callable(Validator): void>
     */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                /** @var Enrollment $enrollment */
                $enrollment = $this->route('enrollment');

                if ($enrollment->billingContract->load('installments.payments')->remainingBalance() <= 0) {
                    $validator->errors()->add('payment_channel', 'This application is already fully paid.');
                }
            },
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'payment_channel.required' => 'Choose how you will pay.',
            'payment_channel.in' => 'That payment method is not available yet. Choose another one.',
        ];
    }
}
