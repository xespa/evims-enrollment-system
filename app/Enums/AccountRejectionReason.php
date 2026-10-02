<?php

namespace App\Enums;

/**
 * Why an admin did not approve a portal account. Each reason tells the
 * account holder what went wrong and how to fix it.
 */
enum AccountRejectionReason: string
{
    case BlurryId = 'BLURRY_ID';
    case IncompleteId = 'INCOMPLETE_ID';
    case UnacceptedId = 'UNACCEPTED_ID';
    case ExpiredId = 'EXPIRED_ID';
    case NameMismatch = 'NAME_MISMATCH';
    case Other = 'OTHER';

    /**
     * Short label for admins choosing a reason.
     */
    public function label(): string
    {
        return match ($this) {
            self::BlurryId => 'ID is blurred or unreadable',
            self::IncompleteId => 'ID is cropped or partly hidden',
            self::UnacceptedId => 'Not an accepted ID',
            self::ExpiredId => 'ID is expired',
            self::NameMismatch => 'Name does not match the account',
            self::Other => 'Other reason',
        };
    }

    /**
     * What the account holder is told, including how to fix it.
     */
    /**
     * Whether fixing this needs more than a new ID — e.g. correcting the
     * name on the account — so the whole sign-up form must be filled in again.
     */
    public function needsFullSignup(): bool
    {
        return match ($this) {
            self::NameMismatch, self::Other => true,
            default => false,
        };
    }

    public function guidance(): string
    {
        return match ($this) {
            self::BlurryId => 'We could not read your ID. Please upload a sharp, well-lit photo or scan with no glare.',
            self::IncompleteId => 'Part of your ID was cut off or covered. Please upload a photo that shows the whole ID, with all four corners visible.',
            self::UnacceptedId => 'The document you uploaded is not one of the IDs we accept. Please upload an accepted government-issued ID (students may use a school ID).',
            self::ExpiredId => 'Your ID has expired. Please upload a valid, unexpired ID.',
            self::NameMismatch => 'The name on your ID does not match the name on your account. Please upload an ID in your name, or contact the registrar if your name has changed.',
            self::Other => 'Please see the note from the school below.',
        };
    }
}
