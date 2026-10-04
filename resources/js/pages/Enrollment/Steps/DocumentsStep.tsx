import { FileCheck2, Info } from 'lucide-react';
import StepGuide from '../Components/StepGuide';

const DOCUMENTS = [
    { field: 'form_138', label: 'Form 138 (Report Card)' },
    { field: 'birth_certificate', label: 'PSA Birth Certificate' },
    { field: 'good_moral_certificate', label: 'Good Moral Certificate' },
];

/**
 * `documentsOnFile` is a returning student's documents from their last
 * approved school year, as sent by the LRN check — `{ schoolYear,
 * birth_certificate, good_moral_certificate }`, true when kept on file.
 * Null for a new student.
 */
export default function DocumentsStep({
    data,
    setData,
    errors,
    documentsOnFile,
}) {
    const isReturning = !!documentsOnFile;

    const handleFile = (field) => (e) => {
        setData(field, e.target.files[0] ?? null);
    };

    const hintFor = (field) => {
        if (isReturning && field === 'form_138') {
            return 'No upload needed — the registrar will attach your child’s latest report card from EVIMS.';
        }

        if (documentsOnFile?.[field]) {
            return `On file from S.Y. ${documentsOnFile.schoolYear} — no need to upload again. PDF, JPG, or PNG · max 10MB`;
        }

        return 'PDF, JPG, or PNG · max 10MB';
    };

    return (
        <div>
            <h2 className="mb-3 font-serif text-xl font-semibold text-[#1F2A24]">
                Supporting Documents
            </h2>
            {isReturning ? (
                <StepGuide>
                    Welcome back! The documents you submitted for S.Y.{' '}
                    {documentsOnFile.schoolYear} are kept on file, so you don't
                    need to upload them again this school year.
                </StepGuide>
            ) : (
                <StepGuide>
                    Optional for now — if you don't have a scanned copy yet, you
                    can upload or replace these later from your student portal
                    any time before your application is approved.
                </StepGuide>
            )}

            {isReturning && (
                <div
                    role="note"
                    className="mb-3 flex gap-2 rounded-xl border border-[#E8A33D]/30 bg-[#E8A33D]/10 p-4 text-sm text-[#7a4d0b]"
                >
                    <Info
                        className="mt-0.5 h-4 w-4 shrink-0"
                        aria-hidden="true"
                    />
                    <p>
                        <span className="font-semibold">
                            Did anything on the PSA Birth Certificate change?
                        </span>{' '}
                        If your child's name, birth date, sex, or PSA number was
                        corrected or updated since last school year (for example
                        after a legitimation or a clerical correction), upload
                        the new PSA copy below and make sure step 1 matches it.
                        If those details changed and no new copy is uploaded,
                        the one on file won't be used and you'll be asked for a
                        new one.
                    </p>
                </div>
            )}

            {DOCUMENTS.map((doc) => {
                const hintId = `${doc.field}-hint`;
                const errorId = `${doc.field}-error`;
                const isDisabled = isReturning && doc.field === 'form_138';

                return (
                    <div
                        key={doc.field}
                        className={`mb-3 rounded-xl border border-[#1F2A24]/10 p-4 ${isDisabled ? 'bg-[#1F2A24]/[0.03]' : ''}`}
                    >
                        <label
                            htmlFor={doc.field}
                            className="block text-sm font-medium text-[#1F2A24]/80"
                        >
                            {doc.label}
                            {documentsOnFile?.[doc.field] && (
                                <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-[#2F6F4E]/10 px-2 py-0.5 text-xs font-semibold text-[#2F6F4E]">
                                    <FileCheck2
                                        className="h-3 w-3"
                                        aria-hidden="true"
                                    />
                                    On file
                                </span>
                            )}
                        </label>
                        <p
                            id={hintId}
                            className="mb-2 text-xs text-[#1F2A24]/65"
                        >
                            {hintFor(doc.field)}
                        </p>
                        <input
                            id={doc.field}
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            disabled={isDisabled}
                            onChange={handleFile(doc.field)}
                            aria-invalid={errors[doc.field] ? true : undefined}
                            aria-describedby={
                                errors[doc.field]
                                    ? `${hintId} ${errorId}`
                                    : hintId
                            }
                            className="block w-full text-sm text-[#1F2A24]/75 file:mr-4 file:min-h-10 file:rounded-full file:border-0 file:bg-[#2F6F4E]/10 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[#2F6F4E] hover:file:bg-[#2F6F4E]/15 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                        {data[doc.field] && (
                            <p className="mt-2 flex items-center gap-1.5 text-xs text-[#2F6F4E]">
                                <FileCheck2
                                    className="h-3.5 w-3.5 shrink-0"
                                    aria-hidden="true"
                                />
                                <span className="truncate">
                                    Selected: {data[doc.field].name}
                                    {documentsOnFile?.[doc.field] &&
                                        ' (replaces the copy on file)'}
                                </span>
                            </p>
                        )}
                        {errors[doc.field] && (
                            <p
                                id={errorId}
                                className="mt-1 text-sm text-[#C6473B]"
                            >
                                {errors[doc.field]}
                            </p>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
