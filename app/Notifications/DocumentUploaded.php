<?php

namespace App\Notifications;

use App\Models\Enrollment;
use App\Models\OfficeVerification;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

/**
 * Tells the admins a parent uploaded a document from the portal that
 * needs to be checked.
 */
class DocumentUploaded extends Notification implements ShouldQueue
{
    use Queueable;

    public const TYPE = 'document_uploaded';

    /**
     * @param  string  $documentType  A key of OfficeVerification::DOCUMENT_COLUMNS.
     */
    public function __construct(public Enrollment $enrollment, public string $documentType) {}

    /**
     * @return array<int, string>
     */
    public function via(User $notifiable): array
    {
        return ['database'];
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(User $notifiable): array
    {
        $this->enrollment->loadMissing('student');
        $student = $this->enrollment->student;
        $label = OfficeVerification::DOCUMENT_COLUMNS[$this->documentType]['label'];

        return [
            'type' => self::TYPE,
            'enrollment_id' => $this->enrollment->id,
            'document' => $this->documentType,
            'student_name' => trim("{$student->first_name} {$student->last_name}"),
            'title' => 'Document to verify',
            'message' => "{$student->first_name} {$student->last_name}'s parent uploaded a {$label}.",
            'url' => route('admin.enrollments.show', $this->enrollment, false),
        ];
    }
}
