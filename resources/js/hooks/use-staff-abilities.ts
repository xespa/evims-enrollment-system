import { usePage } from '@inertiajs/react';
import type { StaffAbilities } from '@/types/auth';

const NO_ABILITIES: StaffAbilities = {
    viewDashboard: false,
    reviewApplications: false,
    handlePayments: false,
    manageSchool: false,
    manageStaff: false,
    uploadDocumentTypes: [],
};

/**
 * What the signed-in staff member may do, for hiding actions they can't
 * use. The server enforces the same rules, so this is only for the UI.
 */
export function useStaffAbilities(): StaffAbilities {
    return usePage().props.auth.can ?? NO_ABILITIES;
}
