<?php

namespace App\Enums;

/**
 * Why an admin did not approve an enrollment application. Each reason tells
 * the parent what went wrong and what to do about it.
 */
enum EnrollmentRejectionReason: string
{
    case IncompleteGrades = 'INCOMPLETE_GRADES';
    case MissingRequirements = 'MISSING_REQUIREMENTS';
    case InvalidDocuments = 'INVALID_DOCUMENTS';
    case AgeRequirementNotMet = 'AGE_REQUIREMENT_NOT_MET';
    case NoSlotsAvailable = 'NO_SLOTS_AVAILABLE';
    case Other = 'OTHER';

    /**
     * Short label for admins choosing a reason.
     */
    public function label(): string
    {
        return match ($this) {
            self::IncompleteGrades => 'Incomplete grades',
            self::MissingRequirements => 'Missing requirements',
            self::InvalidDocuments => 'Documents could not be verified',
            self::AgeRequirementNotMet => 'Age requirement not met',
            self::NoSlotsAvailable => 'No slots available',
            self::Other => 'Other reason',
        };
    }

    /**
     * What the parent is told, including how to fix it.
     */
    public function guidance(): string
    {
        return match ($this) {
            self::IncompleteGrades => 'The report card (Form 138) shows incomplete grades. Please settle them with the previous school, then apply again with the complete report card.',
            self::MissingRequirements => 'Some required documents were not submitted. Please prepare the complete requirements, then apply again.',
            self::InvalidDocuments => 'We could not verify one or more of the documents submitted. Please upload clear, complete, and valid copies when you apply again.',
            self::AgeRequirementNotMet => 'The student does not meet the age requirement for the chosen grade level. Please contact the registrar about the right grade level.',
            self::NoSlotsAvailable => 'All slots for this grade level are already filled. Please contact the registrar about other options.',
            self::Other => 'Please see the note from the school below.',
        };
    }
}
