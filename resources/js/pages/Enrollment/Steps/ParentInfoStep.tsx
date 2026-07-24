import TextInput from '../Components/TextInput';

export default function ParentInfoStep({ data, setData, errors }) {
    return (
        <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Parent / Guardian Information</h2>

            <h3 className="text-sm font-semibold text-gray-600 mb-2 mt-4">Father</h3>
            <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
                <TextInput label="Last Name" name="father_last_name" value={data.father_last_name} onChange={setData} error={errors.father_last_name} />
                <TextInput label="First Name" name="father_first_name" value={data.father_first_name} onChange={setData} error={errors.father_first_name} />
                <TextInput label="Middle Name" name="father_middle_name" value={data.father_middle_name} onChange={setData} error={errors.father_middle_name} />
                <TextInput label="Occupation" name="father_occupation" value={data.father_occupation} onChange={setData} error={errors.father_occupation} />
                <TextInput label="Office Name" name="father_name_of_office" value={data.father_name_of_office} onChange={setData} error={errors.father_name_of_office} />
                <TextInput label="Mobile No." name="father_mobile_no" value={data.father_mobile_no} onChange={setData} error={errors.father_mobile_no} />
            </div>

            <h3 className="text-sm font-semibold text-gray-600 mb-2 mt-6">Mother</h3>
            <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
                <TextInput label="Maiden Last Name" name="mother_maiden_last_name" value={data.mother_maiden_last_name} onChange={setData} error={errors.mother_maiden_last_name} />
                <TextInput label="First Name" name="mother_first_name" value={data.mother_first_name} onChange={setData} error={errors.mother_first_name} />
                <TextInput label="Middle Name" name="mother_middle_name" value={data.mother_middle_name} onChange={setData} error={errors.mother_middle_name} />
                <TextInput label="Occupation" name="mother_occupation" value={data.mother_occupation} onChange={setData} error={errors.mother_occupation} />
                <TextInput label="Office Name" name="mother_name_of_office" value={data.mother_name_of_office} onChange={setData} error={errors.mother_name_of_office} />
                <TextInput label="Mobile No." name="mother_mobile_no" value={data.mother_mobile_no} onChange={setData} error={errors.mother_mobile_no} />
            </div>
        </div>
    );
}
