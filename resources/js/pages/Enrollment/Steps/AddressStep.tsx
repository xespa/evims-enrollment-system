import TextInput from '../Components/TextInput';

export default function AddressStep({ data, setData, errors }) {
    return (
        <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Residential Address</h2>

            <TextInput label="House No. / Street" name="house_number_street" value={data.house_number_street} onChange={setData} error={errors.house_number_street} />

            <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
                <TextInput label="Barangay" name="barangay" value={data.barangay} onChange={setData} error={errors.barangay} required />
                <TextInput label="City / Municipality" name="city_municipality" value={data.city_municipality} onChange={setData} error={errors.city_municipality} required />
                <TextInput label="Province" name="province" value={data.province} onChange={setData} error={errors.province} required />
                <TextInput label="Country" name="country" value={data.country} onChange={setData} error={errors.country} required />
                <TextInput label="Zip Code" name="zip_code" value={data.zip_code} onChange={setData} error={errors.zip_code} />
            </div>
        </div>
    );
}
