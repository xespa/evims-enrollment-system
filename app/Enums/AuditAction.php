<?php

namespace App\Enums;

/**
 * The security-relevant staff actions written to the audit log.
 */
enum AuditAction: string
{
    case SignedIn = 'signed_in';
    case SignInFailed = 'sign_in_failed';
    case TwoFactorEnabled = 'two_factor_enabled';
    case TwoFactorDisabled = 'two_factor_disabled';
    case RecoveryCodesRegenerated = 'recovery_codes_regenerated';
    case StaffInvited = 'staff_invited';
    case InvitationResent = 'invitation_resent';
    case InvitationAccepted = 'invitation_accepted';
    case RoleChanged = 'role_changed';
    case StaffDeactivated = 'staff_deactivated';
    case StaffReactivated = 'staff_reactivated';
    case StaffSignUpRequested = 'staff_sign_up_requested';
    case StaffSignUpApproved = 'staff_sign_up_approved';
    case StaffSignUpRejected = 'staff_sign_up_rejected';
    case DocumentUploaded = 'document_uploaded';
    case StudentConsentRequested = 'student_consent_requested';
    case StudentConsentAnswered = 'student_consent_answered';

    public function label(): string
    {
        return match ($this) {
            self::SignedIn => 'Signed in',
            self::SignInFailed => 'Failed sign-in',
            self::TwoFactorEnabled => 'Turned on two-factor',
            self::TwoFactorDisabled => 'Turned off two-factor',
            self::RecoveryCodesRegenerated => 'New recovery codes',
            self::StaffInvited => 'Invited staff',
            self::InvitationResent => 'Resent invitation',
            self::InvitationAccepted => 'Accepted invitation',
            self::RoleChanged => 'Changed role',
            self::StaffDeactivated => 'Deactivated account',
            self::StaffReactivated => 'Reactivated account',
            self::StaffSignUpRequested => 'Asked for a staff account',
            self::StaffSignUpApproved => 'Approved staff account request',
            self::StaffSignUpRejected => 'Rejected staff account request',
            self::DocumentUploaded => 'Uploaded document',
            self::StudentConsentRequested => 'Asked parent consent for a student account',
            self::StudentConsentAnswered => 'Parent answered student account consent',
        };
    }

    /**
     * Worth a second look when reading the log.
     */
    public function isWarning(): bool
    {
        return in_array($this, [self::SignInFailed, self::TwoFactorDisabled, self::StaffDeactivated], true);
    }
}
