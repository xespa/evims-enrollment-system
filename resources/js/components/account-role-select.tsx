import InputError from '@/components/input-error';
import { Label } from '@/components/ui/label';

export type AccountRoleValue =
    | 'STUDENT'
    | 'PARENT_GUARDIAN'
    | 'TEACHER'
    | 'CASHIER'
    | 'REGISTRAR'
    | 'ADMIN';

export type AccountRoleOption = {
    value: AccountRoleValue;
    label: string;
    isStaff: boolean;
};

type Props = {
    roles: AccountRoleOption[];
    value: AccountRoleValue | '';
    onChange: (value: AccountRoleValue | '') => void;
    label: string;
    /** Submitted with the form, e.g. account_type for portal accounts. */
    name?: string;
    error?: string;
};

/**
 * Who is signing in or signing up, on the shared login and sign-up pages.
 * Families and students are listed apart from school staff.
 */
export default function AccountRoleSelect({
    roles,
    value,
    onChange,
    label,
    name,
    error,
}: Props) {
    const familyRoles = roles.filter((role) => !role.isStaff);
    const staffRoles = roles.filter((role) => role.isStaff);

    const renderOptions = (options: AccountRoleOption[]) =>
        options.map((role) => (
            <option
                key={role.value}
                value={role.value}
                className="text-[#1F2A24]"
            >
                {role.label}
            </option>
        ));

    return (
        <div>
            <Label
                htmlFor="account_role"
                className="mb-1 block text-sm font-medium text-[#1F2A24]/80"
            >
                {label}
            </Label>
            <select
                id="account_role"
                name={name}
                required
                value={value}
                onChange={(e) =>
                    onChange(e.target.value as AccountRoleValue | '')
                }
                aria-invalid={error ? true : undefined}
                className={`h-10 w-full rounded-md border border-[#1F2A24]/15 bg-white px-3 text-sm shadow-xs focus-visible:border-[#2F6F4E] focus-visible:ring-[3px] focus-visible:ring-[#2F6F4E]/30 focus-visible:outline-none aria-[invalid=true]:border-[#C6473B] ${
                    value ? 'text-[#1F2A24]' : 'text-[#1F2A24]/50'
                }`}
            >
                <option value="" disabled>
                    Choose one
                </option>
                {staffRoles.length > 0 ? (
                    <>
                        <optgroup label="Students and families">
                            {renderOptions(familyRoles)}
                        </optgroup>
                        <optgroup label="School staff">
                            {renderOptions(staffRoles)}
                        </optgroup>
                    </>
                ) : (
                    renderOptions(familyRoles)
                )}
            </select>
            <InputError message={error} />
        </div>
    );
}
