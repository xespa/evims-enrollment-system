<?php

namespace App\Notifications;

use App\Models\Enrollment;
use Illuminate\Notifications\Notification;

class DocumentReminder extends Notification
{
    public function __construct(
        public Enrollment $enrollment,
        public string $documentLabel,
        public string $reasonText,
        public ?string $note = null,
    ) {}

    public function via($notifiable): array
    {
        return ['database'];
    }

    public function toArray($notifiable): array
    {
        $student = $this->enrollment->student;

        $message = "{$student->first_name}'s {$this->documentLabel} needs attention: {$this->reasonText}";

        if ($this->note) {
            $message .= " Note from the registrar: \"{$this->note}\"";
        }

        $message .= ' Please upload a new copy from your portal.';

        return [
            'type' => 'document_reminder',
            'enrollment_id' => $this->enrollment->id,
            'student_name' => trim("{$student->first_name} {$student->last_name}"),
            'document' => $this->documentLabel,
            'reason' => $this->reasonText,
            'note' => $this->note,
            'title' => 'Document needs attention',
            'message' => $message,
            'url' => '/portal/dashboard',
        ];
    }
}
