<?php

namespace App\Http\Controllers\Admin;

use App\Actions\SendStaffInvitation;
use App\Enums\AuditAction;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreStaffAccountRequest;
use App\Http\Requests\Admin\UpdateStaffAccountRequest;
use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class StaffAccountController extends Controller
{
    /**
     * List every staff account with its role and whether it's usable yet.
     */
    public function index(): Response
    {
        $staffAccounts = User::query()
            ->orderByRaw('deactivated_at is not null')
            ->orderBy('name')
            ->get(['id', 'name', 'email', 'role', 'profile_photo_path', 'email_verified_at', 'invited_at', 'deactivated_at', 'created_at'])
            ->map(fn (User $staffAccount): array => [
                'id' => $staffAccount->id,
                'name' => $staffAccount->name,
                'email' => $staffAccount->email,
                'role' => $staffAccount->role->value,
                'profile_photo_url' => $staffAccount->profile_photo_url,
                'status' => match (true) {
                    ! $staffAccount->isActive() => 'deactivated',
                    $staffAccount->hasPendingInvitation() => 'invited',
                    default => 'active',
                },
                'invited_at' => $staffAccount->invited_at?->toIso8601String(),
                'deactivated_at' => $staffAccount->deactivated_at?->toIso8601String(),
            ]);

        return Inertia::render('Admin/StaffAccounts/Index', [
            'staffAccounts' => $staffAccounts,
            'roles' => array_map(fn (UserRole $role): array => [
                'value' => $role->value,
                'label' => $role->label(),
                'description' => $role->description(),
            ], UserRole::cases()),
        ]);
    }

    /**
     * Create the account with an unusable random password and email the
     * person a link to set their own; the admin never sees a password.
     */
    public function store(StoreStaffAccountRequest $request, SendStaffInvitation $sendStaffInvitation): RedirectResponse
    {
        $staffAccount = DB::transaction(function () use ($request): User {
            $staffAccount = User::create([
                'name' => $request->validated('name'),
                'email' => $request->validated('email'),
                'role' => $request->validated('role'),
                'password' => Str::password(64),
            ]);
            $staffAccount->forceFill(['invited_at' => now()])->save();

            AuditLog::record(AuditAction::StaffInvited, $staffAccount, ['role' => $staffAccount->role->value]);

            return $staffAccount;
        });

        $sendStaffInvitation->handle($staffAccount);

        return to_route('admin.staff-accounts.index')
            ->with('success', "Invitation sent to {$staffAccount->email}.");
    }

    /**
     * Change a staff member's role. It takes effect on their next request.
     */
    public function update(UpdateStaffAccountRequest $request, User $staffAccount): RedirectResponse
    {
        $previousRole = $staffAccount->role;

        DB::transaction(function () use ($request, $staffAccount, $previousRole): void {
            $staffAccount->update(['role' => $request->validated('role')]);

            if ($staffAccount->role !== $previousRole) {
                AuditLog::record(AuditAction::RoleChanged, $staffAccount, [
                    'from' => $previousRole->value,
                    'to' => $staffAccount->role->value,
                ]);
            }
        });

        return back()->with('success', "{$staffAccount->name} is now a {$staffAccount->role->label()}.");
    }
}
