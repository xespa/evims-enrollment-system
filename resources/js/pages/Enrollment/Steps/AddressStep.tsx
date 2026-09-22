import { useEffect, useState } from 'react';
import TextInput from '../Components/TextInput';
import SelectInput from '../Components/SelectInput';

export default function AddressStep({ data, setData, errors }) {
    const [provinces, setProvinces] = useState([]);
    const [cities, setCities] = useState([]);
    const [barangays, setBarangays] = useState([]);

    // Seeded straight from the form data (not re-derived by matching names
    // after a fresh fetch) so a selection already made survives navigating
    // away to a later step and back — this component unmounts/remounts on
    // every step change, but `data` lives in the parent and never resets.
    const [provinceCode, setProvinceCode] = useState(data.province_code ?? '');
    const [cityCode, setCityCode] = useState(data.city_code ?? '');
    const [zipCodeOptions, setZipCodeOptions] = useState([]);

    const [loadingProvinces, setLoadingProvinces] = useState(true);
    const [loadingCities, setLoadingCities] = useState(false);
    const [loadingBarangays, setLoadingBarangays] = useState(false);

    // Always load the full province list, purely for the dropdown's options
    // (labels) — the selected value itself already comes from `data` above.
    useEffect(() => {
        fetch('/api/ph-address/provinces')
            .then((res) => res.json())
            .then((json) => setProvinces(Array.isArray(json) ? json : []))
            .catch(() => setProvinces([]))
            .finally(() => setLoadingProvinces(false));
    }, []);

    // Whenever the province code is known (picked by the user, or restored
    // from `data.province_code` on mount), load its cities.
    useEffect(() => {
        if (!provinceCode) return;

        setLoadingCities(true);
        fetch(`/api/ph-address/cities/${provinceCode}`)
            .then((res) => res.json())
            .then((json) => setCities(Array.isArray(json) ? json : []))
            .finally(() => setLoadingCities(false));
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

    // Whenever the city code is known, suggest zip code(s) for it. Coverage
    // is partial, so no match just leaves the plain text field for manual
    // entry — this never overwrites a zip code the user already has.
    useEffect(() => {
        if (!cityCode || !data.city_municipality) {
            setZipCodeOptions([]);
            return;
        }

        const params = new URLSearchParams({
            province: data.province,
            city: data.city_municipality,
        });

        fetch(`/api/ph-address/zip-codes?${params}`)
            .then((res) => res.json())
            .then((json) => {
                const list = Array.isArray(json) ? json : [];
                setZipCodeOptions(list);
                if (list.length === 1 && !data.zip_code) {
                    setData((prev) => ({ ...prev, zip_code: list[0] }));
                }
            })
            .catch(() => setZipCodeOptions([]));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cityCode]);

    const handleProvinceChange = (name, value) => {
        const selected = provinces.find((p) => p.prov_code === value);

        setProvinceCode(value);
        setCities([]);
        setBarangays([]);
        setCityCode('');
        setZipCodeOptions([]);

        setData((prev) => ({
            ...prev,
            province: selected ? selected.name : '',
            province_code: value,
            city_municipality: '',
            city_code: '',
            barangay: '',
            zip_code: '',
        }));
    };

    const handleCityChange = (name, value) => {
        const selected = cities.find((c) => c.mun_code === value);

        setCityCode(value);
        setBarangays([]);
        setZipCodeOptions([]);

        setData((prev) => ({
            ...prev,
            city_municipality: selected ? selected.name : '',
            city_code: value,
            barangay: '',
            zip_code: '',
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

                {zipCodeOptions.length > 1 ? (
                    <SelectInput
                        label="Zip Code"
                        name="zip_code"
                        value={data.zip_code}
                        onChange={setData}
                        error={errors.zip_code}
                        options={zipCodeOptions.map((zip) => ({
                            value: zip,
                            label: zip,
                        }))}
                    />
                ) : (
                    <TextInput
                        label="Zip Code"
                        name="zip_code"
                        value={data.zip_code}
                        onChange={setData}
                        error={errors.zip_code}
                    />
                )}
            </div>
        </div>
    );
}
