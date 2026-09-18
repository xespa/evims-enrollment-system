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

    // Load provinces, then restore the previously selected province (if this
    // step was already filled in and the user came back to it) so it doesn't
    // look like the selection was lost.
    useEffect(() => {
        fetch('/api/ph-address/provinces')
            .then((res) => res.json())
            .then((json) => {
                const list = Array.isArray(json) ? json : [];
                setProvinces(list);

                if (data.province) {
                    const match = list.find((p) => p.name === data.province);
                    if (match) setProvinceCode(match.prov_code);
                }
            })
            .catch(() => setProvinces([]))
            .finally(() => setLoadingProvinces(false));
        // Only ever run once on mount — restoration reads `data` at that point.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Whenever the province code is known (picked by the user, or restored
    // above), load its cities and restore the previously selected city.
    useEffect(() => {
        if (!provinceCode) return;

        setLoadingCities(true);
        fetch(`/api/ph-address/cities/${provinceCode}`)
            .then((res) => res.json())
            .then((json) => {
                const list = Array.isArray(json) ? json : [];
                setCities(list);

                if (data.city_municipality) {
                    const match = list.find(
                        (c) => c.name === data.city_municipality,
                    );
                    if (match) setCityCode(match.mun_code);
                }
            })
            .finally(() => setLoadingCities(false));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [provinceCode]);

    // Whenever the city code is known, load its barangays so the barangay
    // dropdown has the previously selected option available to show.
    useEffect(() => {
        if (!cityCode) return;

        setLoadingBarangays(true);
        fetch(`/api/ph-address/barangays/${cityCode}`)
            .then((res) => res.json())
            .then((json) => setBarangays(Array.isArray(json) ? json : []))
            .finally(() => setLoadingBarangays(false));
    }, [cityCode]);

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
    };

    const handleBarangayChange = (name, value) => {
        setData('barangay', value);
    };

    return (
        <div>
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
                Residential Address
            </h2>

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
                    options={provinces.map((p) => ({
                        value: p.prov_code,
                        label: p.name,
                    }))}
                />

                <SelectInput
                    label="City / Municipality"
                    name="city_code"
                    value={cityCode}
                    onChange={handleCityChange}
                    error={errors.city_municipality}
                    required
                    disabled={!provinceCode || loadingCities}
                    options={cities.map((c) => ({
                        value: c.mun_code,
                        label: c.name,
                    }))}
                />

                <SelectInput
                    label="Barangay"
                    name="barangay"
                    value={data.barangay}
                    onChange={handleBarangayChange}
                    error={errors.barangay}
                    required
                    disabled={!cityCode || loadingBarangays}
                    options={barangays.map((b) => ({
                        value: b.name,
                        label: b.name,
                    }))}
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
