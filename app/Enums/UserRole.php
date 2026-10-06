<?php

namespace App\Enums;

/**
 * What a school staff account may do in the admin panel. Each ability is a
 * method here so the whole permission matrix lives in one place; the gates
 * in AppServiceProvider read from it.
 */
enum UserRole: string
{
    case Admin = 'ADMIN';
    case Registrar = 'REGISTRAR';
    case Teacher = 'TEACHER';
    case Cashier = 'CASHIER';

    /**
     * Documents a teacher may upload: the academic records advisers keep.
     */
    private const TEACHER_DOCUMENT_TYPES = ['form_138'];

    public function label(): string
    {
        return match ($this) {
            self::Admin => 'Administrator',
            self::Registrar => 'Registrar',
            self::Teacher => 'Teacher',
            self::Cashier => 'Cashier',
        };
    }

    /**
     * What the role can do, as shown when inviting staff.
     */
    public function description(): string
    {
        return match ($this) {
            self::Admin => 'Everything, including school year setup and staff accounts.',
            self::Registrar => 'Reviews applications and portal accounts, uploads documents, and records payments.',
            self::Teacher => 'Views students and uploads their Form 138 (report card).',
            self::Cashier => 'Records and voids counter payments and views transactions.',
        };
    }

    /**
     * The overview of applications, payments, and the enrollment period.
     */
    public function canViewDashboard(): bool
    {
        return in_array($this, [self::Admin, self::Registrar], true);
    }

    /**
     * Approve or reject applications and portal accounts, assign LRNs, and
     * manage document checklists, reminders, and appointments.
     */
    public function canReviewApplications(): bool
    {
        return in_array($this, [self::Admin, self::Registrar], true);
    }

    /**
     * Record and void counter payments and see the transactions list.
     */
    public function canHandlePayments(): bool
    {
        return in_array($this, [self::Admin, self::Registrar, self::Cashier], true);
    }

    /**
     * School year setup, fees, subjects, enrollment periods, events, and
     * deleting applications.
     */
    public function canManageSchool(): bool
    {
        return $this === self::Admin;
    }

    /**
     * Invite staff, change their roles, and deactivate their accounts.
     */
    public function canManageStaff(): bool
    {
        return $this === self::Admin;
    }

    /**
     * Admins and registrars approve applications, handle payments, and see
     * every family's details, so they can't use the panel until two-factor
     * authentication is set up. It's optional for the other roles.
     */
    public function requiresTwoFactor(): bool
    {
        return in_array($this, [self::Admin, self::Registrar], true);
    }

    public function canUploadDocument(string $type): bool
    {
        return match ($this) {
            self::Admin, self::Registrar => true,
            self::Teacher => in_array($type, self::TEACHER_DOCUMENT_TYPES, true),
            self::Cashier => false,
        };
    }

    /**
     * The page to land on after signing in.
     */
    public function homeRoute(): string
    {
        return match ($this) {
            self::Admin, self::Registrar => 'admin.dashboard',
            self::Teacher => 'admin.students.index',
            self::Cashier => 'admin.transactions.index',
        };
    }

    /**
     * @return list<self>
     */
    public static function applicationReviewers(): array
    {
        return array_values(array_filter(self::cases(), fn (self $role): bool => $role->canReviewApplications()));
    }

    /**
     * @return list<self>
     */
    public static function paymentHandlers(): array
    {
        return array_values(array_filter(self::cases(), fn (self $role): bool => $role->canHandlePayments()));
    }
}
