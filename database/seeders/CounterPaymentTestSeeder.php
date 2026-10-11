<?php

namespace Database\Seeders;

use App\Actions\Payments\RecordCounterPayment;
use App\Actions\Payments\VoidCounterPayment;
use App\Enums\PaymentForm;
use App\Enums\UserRole;
use App\Models\BillingContract;
use App\Models\Curriculum;
use App\Models\EnrolleeUser;
use App\Models\Enrollment;
use App\Models\Payment;
use App\Models\Student;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Notification;

/**
 * Ten approved, counter-paying enrollees for trying out "Record counter
 * payment": four with nothing paid, the rest with earlier cash and check
 * receipts, one of them voided. Run it on its own; it isn't part of
 * DatabaseSeeder.
 */
class CounterPaymentTestSeeder extends Seeder
{
    private const PAYMENT_OPTIONS = ['MONTHLY', 'MONTHLY', 'BI_MONTHLY'];

    private User $cashier;

    private int $nextReceiptNumber;

    public function __construct(
        private RecordCounterPayment $recordCounterPayment,
        private VoidCounterPayment $voidCounterPayment,
    ) {}

    public function run(): void
    {
        $curricula = Curriculum::query()
            ->where('school_year', '2026-2027')
            ->where('tuition_fee', '>=', 10000)
            ->get();

        if ($curricula->isEmpty()) {
            $this->command->error('No 2026-2027 curricula with a tuition fee of at least ₱10,000. Set up the curricula first.');

            return;
        }

        // The parents' emails are made up, so don't send them receipts.
        Notification::fake();

        $this->cashier = User::query()->where('role', UserRole::Admin)->first()
            ?? User::factory()->admin()->withoutTwoFactor()->create(['name' => 'Admin User', 'email' => 'admin@example.com']);
        $this->nextReceiptNumber = $this->highestReceiptNumber() + 1;

        foreach (range(1, 10) as $index) {
            $enrollment = $this->approvedEnrollment($curricula->random());

            $this->recordHistory($enrollment, $index);
        }

        $this->command->info('Seeded 10 approved counter-paying enrollees.');
    }

    private function approvedEnrollment(Curriculum $curriculum): Enrollment
    {
        $student = Student::factory()->create();
        $parent = EnrolleeUser::factory()->create(['name' => fake()->firstName().' '.$student->last_name]);

        $enrollment = Enrollment::factory()->withDocuments()->create([
            'student_id' => $student->id,
            'grade_level_id' => $curriculum->grade_level_id,
            'enrollee_user_id' => $parent->id,
            'email' => $parent->email,
            'enrollment_status' => 'APPROVED',
        ]);

        $enrollment->billingContract()->create([
            'payment_option' => self::PAYMENT_OPTIONS[array_rand(self::PAYMENT_OPTIONS)],
            'payment_channel' => BillingContract::CHANNEL_COUNTER,
            'total_fee' => $curriculum->tuition_fee,
        ])->generateInstallments();

        return $enrollment->load('enrolleeUser', 'billingContract.installments');
    }

    /**
     * Enrollees 1–4 have paid nothing yet; the rest get a mix of receipts.
     */
    private function recordHistory(Enrollment $enrollment, int $index): void
    {
        $firstInstallment = (float) $enrollment->billingContract->installments->sortBy('installment_number')->first()->amount_due;

        if ($index >= 5 && $index <= 7) {
            $this->pay($enrollment, $firstInstallment, '2026-08-15');
        } elseif ($index === 8) {
            $this->pay($enrollment, $firstInstallment, '2026-08-10');
            $this->pay($enrollment, round($firstInstallment * 0.5, 2), '2026-09-12', [
                'payment_form' => PaymentForm::Check,
                'check_bank' => 'Landbank',
                'check_number' => fake()->numerify('00#####'),
                'check_date' => Carbon::parse('2026-09-12'),
            ]);
        } elseif ($index === 9) {
            $payment = $this->pay($enrollment, $firstInstallment, '2026-09-01');
            $this->voidCounterPayment->handle($payment, 'Recorded the wrong amount', $this->cashier);
        } elseif ($index === 10) {
            $this->pay($enrollment, round($firstInstallment / 2, 2), '2026-10-01');
        }
    }

    /**
     * @param  array{payment_form?: PaymentForm, check_bank?: string, check_number?: string, check_date?: Carbon}  $tender
     */
    private function pay(Enrollment $enrollment, float $amount, string $paidOn, array $tender = []): Payment
    {
        $receiptNumber = str_pad((string) $this->nextReceiptNumber++, 4, '0', STR_PAD_LEFT);

        return $this->recordCounterPayment->handle(
            $enrollment,
            $amount,
            $receiptNumber,
            Carbon::parse($paidOn),
            $this->cashier,
            ['received_from' => $enrollment->enrolleeUser->name, 'payment_form' => PaymentForm::Cash, ...$tender],
        )->first();
    }

    /**
     * The highest all-digit receipt number on record, so seeded ones follow it.
     */
    private function highestReceiptNumber(): int
    {
        return Payment::query()
            ->whereNotNull('receipt_number')
            ->pluck('receipt_number')
            ->filter(fn (string $number) => ctype_digit($number))
            ->map(fn (string $number) => (int) $number)
            ->max() ?? 200;
    }
}
