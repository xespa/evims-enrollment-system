import { FileCheck2 } from 'lucide-react';

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
            <h2 className="mb-1 font-serif text-xl font-semibold text-[#1F2A24]">
                Supporting Documents
            </h2>
            <p className="mb-4 text-sm text-[#1F2A24]/70">
                Optional for now — if you don't have a scanned copy yet, you can
                upload or replace these later from your student portal any time
                before your application is approved.
            </p>

            {DOCUMENTS.map((doc) => {
                const hintId = `${doc.field}-hint`;
                const errorId = `${doc.field}-error`;

                return (
                    <div
                        key={doc.field}
                        className="mb-3 rounded-xl border border-[#1F2A24]/10 p-4"
                    >
                        <label
                            htmlFor={doc.field}
                            className="block text-sm font-medium text-[#1F2A24]/80"
                        >
                            {doc.label}
                        </label>
                        <p id={hintId} className="mb-2 text-xs text-[#1F2A24]/65">
                            PDF, JPG, or PNG · max 10MB
                        </p>
                        <input
                            id={doc.field}
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={handleFile(doc.field)}
                            aria-invalid={errors[doc.field] ? true : undefined}
                            aria-describedby={
                                errors[doc.field] ? `${hintId} ${errorId}` : hintId
                            }
                            className="block w-full text-sm text-[#1F2A24]/75 file:mr-4 file:min-h-10 file:rounded-full file:border-0 file:bg-[#2F6F4E]/10 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[#2F6F4E] hover:file:bg-[#2F6F4E]/15"
                        />
                        {data[doc.field] && (
                            <p className="mt-2 flex items-center gap-1.5 text-xs text-[#2F6F4E]">
                                <FileCheck2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                                <span className="truncate">
                                    Selected: {data[doc.field].name}
                                </span>
                            </p>
                        )}
                        {errors[doc.field] && (
                            <p id={errorId} className="mt-1 text-sm text-[#C6473B]">
                                {errors[doc.field]}
                            </p>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
