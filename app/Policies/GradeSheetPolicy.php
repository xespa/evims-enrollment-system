<?php

namespace App\Policies;

use App\Models\GradeSheet;
use App\Models\User;

/**
 * Teachers keep their own grade sheets; admins can open and keep every
 * teacher's. No other role works with grades.
 */
class GradeSheetPolicy
{
    /**
     * Determine whether the user can list grade sheets.
     */
    public function viewAny(User $user): bool
    {
        return $user->role->canManageGradeSheets();
    }

    /**
     * Determine whether the user can open and print the grade sheet.
     */
    public function view(User $user, GradeSheet $gradeSheet): bool
    {
        return $this->keeps($user, $gradeSheet);
    }

    /**
     * Determine whether the user can start a grade sheet.
     */
    public function create(User $user): bool
    {
        return $user->role->canManageGradeSheets();
    }

    /**
     * Determine whether the user can add, edit and remove students' grades.
     * An archived sheet is read-only until it's restored.
     */
    public function update(User $user, GradeSheet $gradeSheet): bool
    {
        return $this->keeps($user, $gradeSheet) && ! $gradeSheet->isArchived();
    }

    /**
     * Determine whether the user can archive the grade sheet, or restore it
     * from the archive. Sheets are never deleted, so grades can't be lost.
     */
    public function archive(User $user, GradeSheet $gradeSheet): bool
    {
        return $this->keeps($user, $gradeSheet);
    }

    private function keeps(User $user, GradeSheet $gradeSheet): bool
    {
        return $user->role->canManageGradeSheets()
            && ($user->isAdmin() || $gradeSheet->teacher_id === $user->id);
    }
}
