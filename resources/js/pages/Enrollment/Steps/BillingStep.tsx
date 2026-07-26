import SelectInput from '../Components/SelectInput';

export default function BillingStep({ data, gradeLevels, setData, errors }) {
    const selectedGrade = gradeLevels.find((g) => String(g.id) === String(data.grade_level_id));
    const fee = selectedGrade?.tuition_fee ?? 0;

    const handleFile = (e) => {
        setData('scanned_contract', e.target.files[0] ?? null);
    };

    const formattedFee = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(fee);

    return (
        <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Billing / Tuition Contract</h2>

            <div className="mb-4 rounded-md border border-blue-200 bg-blue-50 px-4 py-3">
                <p className="text-sm text-gray-600">Total Tuition Fee for {selectedGrade?.name ?? 'selected grade'}</p>
                <p className="text-xl font-bold text-blue-700">{formattedFee}</p>
            </div>

            <SelectInput
                label="Payment Option"
                name="payment_option"
                value={data.payment_option}
                onChange={setData}
                error={errors.payment_option}
                required
                options={[
                    { value: 'MONTHLY', label: 'Monthly' },
                    { value: 'BI_MONTHLY', label: 'Bi-Monthly' },
                    { value: 'FULL_PAYMENT', label: 'Full Payment' },
                ]}
            />

            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    How will you pay? <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <label
                        className={`flex cursor-pointer items-center gap-3 rounded-md border p-3 ${
                            data.payment_channel === 'COUNTER' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                        }`}
                    >
                        <input
                            type="radio"
                            name="payment_channel"
                            value="COUNTER"
                            checked={data.payment_channel === 'COUNTER'}
                            onChange={(e) => setData('payment_channel', e.target.value)}
                        />
                        <div>
                            <p className="text-sm font-medium text-gray-800">Pay at School Counter</p>
                            <p className="text-xs text-gray-500">Cash payment at the registrar's office</p>
                        </div>
                    </label>

                    <label
                        className={`flex cursor-pointer items-center gap-3 rounded-md border p-3 ${
                            data.payment_channel === 'GCASH' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                        }`}
                    >
                        <input
                            type="radio"
                            name="payment_channel"
                            value="GCASH"
                            checked={data.payment_channel === 'GCASH'}
                            onChange={(e) => setData('payment_channel', e.target.value)}
                        />
                        <div>
                            <p className="text-sm font-medium text-gray-800">Pay via GCash</p>
                            <p className="text-xs text-gray-500">Online, using the school's GCash account</p>
                        </div>
                    </label>
                </div>
                {errors.payment_channel && <p className="mt-1 text-sm text-red-600">{errors.payment_channel}</p>}
            </div>

            {data.payment_channel === 'GCASH' && (
                <div className="mb-4 rounded-md border border-green-200 bg-green-50 p-4 text-center">
                    <p className="text-sm font-medium text-gray-700">
                        After you submit this application, you'll receive a secure GCash payment link on the confirmation page.
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                        No need to pay right now — just complete your application first.
                    </p>
                </div>
            )}

            <div className="mt-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Scanned Signed Contract (PDF or image, max 5MB)</label>
                <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFile}
                    className="block w-full text-sm text-gray-600 file:mr-4 file:rounded-md file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-blue-700 hover:file:bg-blue-100"
                />
                {data.scanned_contract && (
                    <p className="mt-1 text-xs text-gray-500">Selected: {data.scanned_contract.name}</p>
                )}
                {errors.scanned_contract && <p className="mt-1 text-sm text-red-600">{errors.scanned_contract}</p>}
            </div>
        </div>
    );
}
