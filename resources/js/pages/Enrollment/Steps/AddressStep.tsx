import { useEffect, useState } from 'react';
import TextInput from '../Components/TextInput';
import SelectInput from '../Components/SelectInput';

export default function AddressStep({ data, setData, errors }) {
    const [provinces, setProvinces] = useState([]);
    const [cities, setCities] = useState([]);
    const [barangays, setBarangays] = useState([]);

    const [provinceCode, setProvinceCode] = useState('');
    const [cityCode, setCityCode] = useState('');

    const [loadingProvinces, setLoadingProvinces] = useState(true);
    const [loadingCities, setLoadingCities] = useState(false);
    const [loadingBarangays, setLoadingBarangays] = useState(false);

    useEffect(() => {
        fetch('/api/ph-address/provinces')
            .then((res) => res.json())
            .then((json) => setProvinces(Array.isArray(json) ? json : []))
            .catch(() => setProvinces([]))
            .finally(() => setLoadingProvinces(false));
    }, []);
    
    const handleProvinceChange = (name, value) => {
        const selected = provinces.find((p) => p.prov_code === value);

        setProvinceCode(value);
        setCities([]);
        setBarangays([]);
        setCityCode('');

        setData((prev) => ({
            ...prev,
            province: selected ? selected.name : '',
            city_municipality: '',
            barangay: '',
        }));

        if (!value) return;

        setLoadingCities(true);
        fetch(`/api/ph-address/cities/${value}`)
            .then((res) => res.json())
            .then(setCities)
            .finally(() => setLoadingCities(false));
    };

    const handleCityChange = (name, value) => {
        const selected = cities.find((c) => c.mun_code === value);

        setCityCode(value);
        setBarangays([]);

        setData((prev) => ({
            ...prev,
            city_municipality: selected ? selected.name : '',
            barangay: '',
        }));

        if (!value) return;

        setLoadingBarangays(true);
        fetch(`/api/ph-address/barangays/${value}`)
            .then((res) => res.json())
            .then(setBarangays)
            .finally(() => setLoadingBarangays(false));
    };

    const handleBarangayChange = (name, value) => {
        setData('barangay', value);
    };

    return (
        <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Residential Address</h2>

            <TextInput
                label="House No. / Street"
                name="house_number_street"
                value={data.house_number_street}
                onChange={setData}
                error={errors.house_number_street}
            />

            <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
                <SelectInput
                    label="Province"
                    name="province_code"
                    value={provinceCode}
                    onChange={handleProvinceChange}
                    error={errors.province}
                    required
                    disabled={loadingProvinces}
                    options={provinces.map((p) => ({ value: p.prov_code, label: p.name }))}
                />

                <SelectInput
                    label="City / Municipality"
                    name="city_code"
                    value={cityCode}
                    onChange={handleCityChange}
                    error={errors.city_municipality}
                    required
                    disabled={!provinceCode || loadingCities}
                    options={cities.map((c) => ({ value: c.mun_code, label: c.name }))}
                />

                <SelectInput
                    label="Barangay"
                    name="barangay"
                    value={data.barangay}
                    onChange={handleBarangayChange}
                    error={errors.barangay}
                    required
                    disabled={!cityCode || loadingBarangays}
                    options={barangays.map((b) => ({ value: b.name, label: b.name }))}
                />

                <SelectInput
                    label="Country"
                    name="country"
                    value={data.country}
                    onChange={setData}
                    error={errors.country}
                    required
                    options={[{ value: 'Philippines', label: 'Philippines' }]}
                />

                <TextInput
                    label="Zip Code"
                    name="zip_code"
                    value={data.zip_code}
                    onChange={setData}
                    error={errors.zip_code}
                />
            </div>
        </div>
    );
}
