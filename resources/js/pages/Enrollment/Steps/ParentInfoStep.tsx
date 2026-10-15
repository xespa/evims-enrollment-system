import { HandHeart, Users } from 'lucide-react';
import MobileNumberInput from '../Components/MobileNumberInput';
import TextInput from '../Components/TextInput';

// Whose details the family fills in; mirrors App\Enums\ParentInfoType.
const OPTIONS = [
    {
        value: 'PARENTS',
        label: 'Parents',
        description: "Fill in the father's and mother's details.",
        icon: Users,
    },
    {
        value: 'GUARDIAN',
        label: 'Guardian',
        description: 'The child lives with a guardian, e.g. a grandparent.',
        icon: HandHeart,
    },
];

export default function ParentInfoStep({ data, setData, errors }) {
    const isGuardian = data.parent_info_type === 'GUARDIAN';

    return (
        <div>
            <h2 className="font-serif text-xl font-semibold text-[#1F2A24] mb-1">Parent / Guardian Information</h2>
            <p id="parent-info-type-hint" className="mb-3 text-sm text-[#1F2A24]/70">Whose details will you fill in?</p>

            <div role="radiogroup" aria-labelledby="parent-info-type-hint" className="mb-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {OPTIONS.map((option) => {
                    const Icon = option.icon;
                    const isSelected = data.parent_info_type === option.value;

                    return (
                        <button
                            key={option.value}
                            type="button"
                            role="radio"
                            aria-checked={isSelected}
                            onClick={() => setData('parent_info_type', option.value)}
                            className={`flex min-h-16 items-start gap-3 rounded-xl border p-4 text-left transition-colors focus-visible:ring-2 focus-visible:ring-[#2F6F4E]/40 focus-visible:outline-none ${
                                isSelected
                                    ? 'border-[#2F6F4E] bg-[#2F6F4E]/5 ring-1 ring-[#2F6F4E]'
                                    : 'border-[#1F2A24]/15 bg-white hover:border-[#2F6F4E]/40 hover:bg-[#2F6F4E]/[0.03]'
                            }`}
                        >
                            <span
                                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                                    isSelected ? 'bg-[#2F6F4E] text-white' : 'bg-[#1F2A24]/5 text-[#1F2A24]/60'
                                }`}
                            >
                                <Icon className="h-4 w-4" aria-hidden="true" />
                            </span>
                            <span>
                                <span className="block text-sm font-semibold text-[#1F2A24]">{option.label}</span>
                                <span className="block text-xs text-[#1F2A24]/65">{option.description}</span>
                            </span>
                        </button>
                    );
                })}
            </div>
            {errors.parent_info_type && <p className="mb-2 text-sm text-[#C6473B]">{errors.parent_info_type}</p>}

            {isGuardian ? (
                <>
                    <h3 className="text-sm font-semibold text-[#1F2A24]/75 mb-2 mt-6">Guardian</h3>
                    <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
                        <TextInput label="Last Name" name="guardian_last_name" value={data.guardian_last_name} onChange={setData} error={errors.guardian_last_name} required />
                        <TextInput label="First Name" name="guardian_first_name" value={data.guardian_first_name} onChange={setData} error={errors.guardian_first_name} required />
                        <TextInput label="Middle Name" name="guardian_middle_name" value={data.guardian_middle_name} onChange={setData} error={errors.guardian_middle_name} />
                        <TextInput
                            label="Relationship to the Child"
                            name="guardian_relationship"
                            placeholder="e.g. Grandmother, Aunt"
                            value={data.guardian_relationship}
                            onChange={setData}
                            error={errors.guardian_relationship}
                            required
                        />
                        <TextInput label="Occupation" name="guardian_occupation" value={data.guardian_occupation} onChange={setData} error={errors.guardian_occupation} />
                        <TextInput label="Office Name" name="guardian_name_of_office" value={data.guardian_name_of_office} onChange={setData} error={errors.guardian_name_of_office} />
                        <MobileNumberInput label="Mobile number" name="guardian_mobile_no" value={data.guardian_mobile_no} onChange={setData} error={errors.guardian_mobile_no} />
                    </div>
                </>
            ) : (
                <>
                    <h3 className="text-sm font-semibold text-[#1F2A24]/75 mb-2 mt-6">Father</h3>
                    <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
                        <TextInput label="Last Name" name="father_last_name" value={data.father_last_name} onChange={setData} error={errors.father_last_name} />
                        <TextInput label="First Name" name="father_first_name" value={data.father_first_name} onChange={setData} error={errors.father_first_name} />
                        <TextInput label="Middle Name" name="father_middle_name" value={data.father_middle_name} onChange={setData} error={errors.father_middle_name} />
                        <TextInput label="Occupation" name="father_occupation" value={data.father_occupation} onChange={setData} error={errors.father_occupation} />
                        <TextInput label="Office Name" name="father_name_of_office" value={data.father_name_of_office} onChange={setData} error={errors.father_name_of_office} />
                        <MobileNumberInput label="Mobile number" name="father_mobile_no" value={data.father_mobile_no} onChange={setData} error={errors.father_mobile_no} />
                    </div>

                    <h3 className="text-sm font-semibold text-[#1F2A24]/75 mb-2 mt-6">Mother</h3>
                    <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
                        <TextInput label="Maiden Last Name" name="mother_maiden_last_name" value={data.mother_maiden_last_name} onChange={setData} error={errors.mother_maiden_last_name} />
                        <TextInput label="First Name" name="mother_first_name" value={data.mother_first_name} onChange={setData} error={errors.mother_first_name} />
                        <TextInput label="Middle Name" name="mother_middle_name" value={data.mother_middle_name} onChange={setData} error={errors.mother_middle_name} />
                        <TextInput label="Occupation" name="mother_occupation" value={data.mother_occupation} onChange={setData} error={errors.mother_occupation} />
                        <TextInput label="Office Name" name="mother_name_of_office" value={data.mother_name_of_office} onChange={setData} error={errors.mother_name_of_office} />
                        <MobileNumberInput label="Mobile number" name="mother_mobile_no" value={data.mother_mobile_no} onChange={setData} error={errors.mother_mobile_no} />
                    </div>
                </>
            )}
        </div>
    );
}
