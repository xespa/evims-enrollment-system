<?php

namespace App\Policies;

use App\Models\EnrolleeUser;
use App\Models\User;

class EnrolleeUserPolicy
{
    /**
     * Determine whether the user can list portal accounts for review.
     */
    public function viewAny(User $user): bool
    {
        return $user->isAdmin();
    }

    /**
     * Determine whether the user can see the account's details, including its valid ID.
     */
    public function view(User $user, EnrolleeUser $enrolleeUser): bool
    {
        return $user->isAdmin();
    }

    /**
     * Determine whether the user can approve or reject the portal account.
     */
    public function update(User $user, EnrolleeUser $enrolleeUser): bool
    {
        return $user->isAdmin();
    }
}
