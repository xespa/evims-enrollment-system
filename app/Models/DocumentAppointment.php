<?php

namespace App\Models;

use Carbon\CarbonImmutable;
use Database\Factories\DocumentAppointmentFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A date for the parent to bring documents to the registrar's office in
 * person, when they can't upload them yet. The date and time are the
 * school's (Philippine) time.
 *
 * @property int $id
 * @property int $enrollment_id
 * @property CarbonImmutable $scheduled_on
 * @property string|null $scheduled_time
 * @property array<int, string> $documents
 * @property string|null $note
 * @property int|null $scheduled_by
 */
class DocumentAppointment extends Model
{
    /** @use HasFactory<DocumentAppointmentFactory> */
    use HasFactory;

    protected $fillable = [
        'scheduled_on',
        'scheduled_time',
        'documents',
        'note',
        'scheduled_by',
    ];

    protected function casts(): array
    {
        return [
            'scheduled_on' => 'date:Y-m-d',
            'documents' => 'array',
        ];
    }

    /**
     * @return BelongsTo<Enrollment, $this>
     */
    public function enrollment(): BelongsTo
    {
        return $this->belongsTo(Enrollment::class);
    }

    /**
     * The documents to bring, by name, e.g. ["PSA Birth Certificate"].
     *
     * @return array<int, string>
     */
    public function documentLabels(): array
    {
        return array_values(array_map(
            fn (string $type) => OfficeVerification::DOCUMENT_COLUMNS[$type]['label'],
            array_filter($this->documents, fn (string $type) => isset(OfficeVerification::DOCUMENT_COLUMNS[$type])),
        ));
    }

    /**
     * When to come in, as the parent reads it: "Oct 10, 2026 at 9:00 AM",
     * or just the date when no time was set.
     */
    public function formattedSchedule(): string
    {
        $date = $this->scheduled_on->format('M j, Y');

        return $this->scheduled_time
            ? $date.' at '.date('g:i A', (int) strtotime($this->scheduled_time))
            : $date;
    }
}
