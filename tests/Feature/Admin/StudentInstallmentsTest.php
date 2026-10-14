<?php

use App\Models\Enrollment;
use App\Models\Payment;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('the students list includes each application\'s installments and payments', function () {
    $admin = User::factory()->create(['role' => 'ADMIN']);
    $enrollment = Enrollment::factory()->create(['enrollment_status' => 'APPROVED']);
    $enrollment->billingContract()->create([
        'payment_option' => 'BI_MONTHLY',
        'payment_channel' => 'GCASH',
        'total_fee' => 10000,
    ])->generateInstallments();
    $firstInstallment = $enrollment->billingContract->installments()->orderBy('installment_number')->first();

    Payment::create([
        'installment_id' => $firstInstallment->id,
        'enrollment_id' => $enrollment->id,
        'amount' => 2000,
        'method' => 'GCASH',
        'status' => 'COMPLETED',
        'paid_at' => '2026-06-10 09:00:00',
    ]);
    Payment::create([
        'installment_id' => $firstInstallment->id,
        'enrollment_id' => $enrollment->id,
        'amount' => 500,
        'method' => 'CASH',
        'receipt_number' => 'OR-7',
        'status' => 'VOIDED',
        'paid_at' => '2026-06-11 09:00:00',
    ]);
    // An abandoned GCash checkout isn't a payment.
    Payment::create([
        'installment_id' => $firstInstallment->id,
        'enrollment_id' => $enrollment->id,
        'amount' => 2000,
        'method' => 'GCASH',
        'status' => 'FAILED',
    ]);
    $firstInstallment->refreshStatus();

    $this->actingAs($admin)
        ->get(route('admin.students.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('applications.data.0.payment.channel', 'GCASH')
            ->where('applications.data.0.payment.channel_label', 'GCash')
            ->has('applications.data.0.installments', 5)
            ->where('applications.data.0.installments.0.installment_number', 1)
            ->where('applications.data.0.installments.0.amount_due', 2000)
            ->where('applications.data.0.installments.0.paid', 2000)
            ->where('applications.data.0.installments.0.status', 'PAID')
            ->where('applications.data.0.installments.0.due_date', $firstInstallment->due_date->toDateString())
            ->has('applications.data.0.installments.0.payments', 2)
            ->where('applications.data.0.installments.0.payments.0.method', 'GCASH')
            ->where('applications.data.0.installments.0.payments.0.status', 'COMPLETED')
            ->where('applications.data.0.installments.0.payments.0.paid_at', '2026-06-10')
            ->where('applications.data.0.installments.0.payments.1.receipt_number', 'OR-7')
            ->where('applications.data.0.installments.0.payments.1.status', 'VOIDED')
            ->where('applications.data.0.installments.1.paid', 0)
            ->where('applications.data.0.installments.1.status', 'UNPAID')
            ->has('applications.data.0.installments.1.payments', 0)
        );
});

test('an application without a bill has no installments', function () {
    $admin = User::factory()->create(['role' => 'ADMIN']);
    Enrollment::factory()->create();

    $this->actingAs($admin)
        ->get(route('admin.students.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('applications.data.0.payment', null)
            ->has('applications.data.0.installments', 0)
        );
});
