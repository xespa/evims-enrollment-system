<?php

namespace App\Enums;

/**
 * Who is signing in or signing up, as picked on the shared login and sign-up
 * pages. Families and students use the portal and student guards; the staff
 * roles use the staff (web) guard and map one-to-one onto UserRole.
 */
enum AccountRole: string
{
    case Student = 'STUDENT';
    case ParentGuardian = 'PARENT_GUARDIAN';
    case Teacher = 'TEACHER';
    case Cashier = 'CASHIER';
    case Registrar = 'REGISTRAR';
    case Admin = 'ADMIN';

    public function label(): string
    {
        return match ($this) {
            self::Student => 'Student',
            self::ParentGuardian => 'Parent / Guardian',
            self::Teacher => 'Teacher',
            self::Cashier => 'Cashier',
            self::Registrar => 'Registrar',
            self::Admin => 'Administrator',
        };
    }

    /**
     * The staff role this maps to, or null for families and students.
     */
    public function staffRole(): ?UserRole
    {
        return UserRole::tryFrom($this->value);
    }

    public function isStaff(): bool
    {
        return $this->staffRole() !== null;
    }

    /**
     * Anyone can sign up except as an administrator; admins are only ever
     * created by another admin.
     */
    public function canSignUp(): bool
    {
        return $this !== self::Admin;
    }

    /**
     * @return list<self>
     */
    public static function signUpRoles(): array
    {
        return array_values(array_filter(self::cases(), fn (self $role): bool => $role->canSignUp()));
    }

    /**
     * Staff roles someone may ask for from the sign-up page.
     *
     * @return list<UserRole>
     */
    public static function requestableStaffRoles(): array
    {
        return array_values(array_filter(array_map(fn (self $role): ?UserRole => $role->staffRole(), self::signUpRoles())));
    }

    /**
     * The dropdown options for the login and sign-up pages.
     *
     * @param  list<self>|null  $roles  Defaults to every role.
     * @return list<array{value: string, label: string, isStaff: bool}>
     */
    public static function options(?array $roles = null): array
    {
        return array_map(
            fn (self $role): array => ['value' => $role->value, 'label' => $role->label(), 'isStaff' => $role->isStaff()],
            $roles ?? self::cases(),
        );
    }
}
