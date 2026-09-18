const DOCUMENTS = [
    { field: 'form_138', label: 'Form 138 (Report Card)' },
    { field: 'birth_certificate', label: 'PSA Birth Certificate' },
    { field: 'good_moral_certificate', label: 'Good Moral Certificate' },
];

export default function DocumentsStep({ data, setData, errors }) {
    const handleFile = (field) => (e) => {
        setData(field, e.target.files[0] ?? null);
    };

    return (
        <div>
            <h2 className="mb-1 text-lg font-semibold text-gray-900">
                Supporting Documents
            </h2>
            <p className="mb-4 text-sm text-gray-500">
                Optional for now — if you don't have a scanned copy yet, you can
                upload or replace these later from your parent portal any time
                before your application is approved.
            </p>

            {DOCUMENTS.map((doc) => (
                <div key={doc.field} className="mb-4">
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                        {doc.label} (PDF or image, max 10MB)
                    </label>
                    <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleFile(doc.field)}
                        className="block w-full text-sm text-gray-600 file:mr-4 file:rounded-md file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-blue-700 hover:file:bg-blue-100"
                    />
                    {data[doc.field] && (
                        <p className="mt-1 text-xs text-gray-500">
                            Selected: {data[doc.field].name}
                        </p>
                    )}
                    {errors[doc.field] && (
                        <p className="mt-1 text-sm text-red-600">
                            {errors[doc.field]}
                        </p>
                    )}
                </div>
            ))}
        </div>
    );
}
