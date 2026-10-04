<?php

namespace Database\Factories;

use App\Models\DocumentAppointment;
use App\Models\Enrollment;
use App\Models\EnrollmentPeriod;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<DocumentAppointment>
 */
class DocumentAppointmentFactory extends Factory
{
    protected $model = DocumentAppointment::class;

    /**
     * Next week, in the morning, to bring the PSA birth certificate.
     */
    public function definition(): array
    {
        return [
            'enrollment_id' => Enrollment::factory(),
            'scheduled_on' => EnrollmentPeriod::today()->addWeek(),
            'scheduled_time' => '09:00',
            'documents' => ['birth_certificate'],
            'note' => null,
        ];
    }
}
