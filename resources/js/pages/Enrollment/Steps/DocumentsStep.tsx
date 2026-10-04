import { Eye, FileCheck2, FileX2, Info } from 'lucide-react';
import { useState } from 'react';
import type { ChangeEvent } from 'react';
import DocumentViewerDialog, {
    isPdfPath,
} from '@/components/document-viewer-dialog';
import StepGuide from '../Components/StepGuide';

type DocumentField =
    'form_138' | 'birth_certificate' | 'good_moral_certificate';

type RetainedDocumentField = Exclude<DocumentField, 'form_138'>;

/**
 * A returning student's documents from their last approved school year,
 * as sent by the LRN check.
 */
interface DocumentsOnFile extends Record<RetainedDocumentField, boolean> {
    schoolYear: string;
    files: Record<RetainedDocumentField, string | null>;
}

type DocumentData = Partial<Record<DocumentField, File | null>>;

interface DocumentsStepProps {
    data: DocumentData;
    setData: (field: DocumentField, value: File | null) => void;
    errors: Partial<Record<DocumentField, string>>;
    documentsOnFile: DocumentsOnFile | null;
}

const DOCUMENTS: { field: DocumentField; label: string }[] = [
    { field: 'form_138', label: 'Form 138 (Report Card)' },
    { field: 'birth_certificate', label: 'PSA Birth Certificate' },
    { field: 'good_moral_certificate', label: 'Good Moral Certificate' },
];

function isOnFile(
    documentsOnFile: DocumentsOnFile | null,
    field: DocumentField,
): boolean {
    return field !== 'form_138' && !!documentsOnFile?.[field];
}

/**
 * ["A"] → "A", ["A", "B"] → "A and B", ["A", "B", "C"] → "A, B and C".
 */
function joinLabels(labels: string[]): string {
    if (labels.length <= 1) {
        return labels.join('');
    }

    return `${labels.slice(0, -1).join(', ')} and ${labels.at(-1)}`;
}

/**
 * The step's instructions, worded from which documents are already on
 * file, which the registrar handles, and which are still left to choose.
 */
function guideText(
    data: DocumentData,
    documentsOnFile: DocumentsOnFile | null,
): string {
    const onFile = DOCUMENTS.filter((doc) =>
        isOnFile(documentsOnFile, doc.field),
    );
    const toUpload = DOCUMENTS.filter(
        (doc) =>
            !isOnFile(documentsOnFile, doc.field) &&
            !(documentsOnFile && doc.field === 'form_138') &&
            !data[doc.field],
    );
    const toUploadLabels = joinLabels(toUpload.map((doc) => doc.label));

    if (!documentsOnFile) {
        return toUpload.length === 0
            ? 'All documents are selected. You can still replace them later from your student portal any time before your application is approved.'
            : `Please upload your child's ${toUploadLabels}. Optional for now — if you don't have a scanned copy yet, you can upload ${toUpload.length === 1 ? 'it' : 'them'} later from your student portal any time before your application is approved.`;
    }

    const parts = ['Welcome back!'];

    if (onFile.length > 0) {
        parts.push(
            `Your ${joinLabels(onFile.map((doc) => doc.label))} from S.Y. ${documentsOnFile.schoolYear} ${onFile.length === 1 ? 'is' : 'are'} kept on file — tap View to check ${onFile.length === 1 ? 'it' : 'them'}. No need to upload again unless ${onFile.length === 1 ? 'it has' : 'they have'} changed.`,
        );
    }

    parts.push(
        'The registrar will attach your child’s latest Form 138 from EVIMS.',
    );

    parts.push(
        toUpload.length === 0
            ? 'Nothing else to upload — you can continue to the next step.'
            : `Please upload the ${toUploadLabels}, which we don't have on file. You can also upload ${toUpload.length === 1 ? 'it' : 'them'} later from your student portal any time before your application is approved.`,
    );

    return parts.join(' ');
}

/**
 * `documentsOnFile` is null for a new student.
 */
export default function DocumentsStep({
    data,
    setData,
    errors,
    documentsOnFile,
}: DocumentsStepProps) {
    const isReturning = !!documentsOnFile;
    // Kept apart from `isViewingDocument` so the viewer doesn't blank out while closing.
    const [viewingDocument, setViewingDocument] = useState<{
        title: string;
        path: string;
    } | null>(null);
    const [isViewingDocument, setIsViewingDocument] = useState(false);

    const handleFile =
        (field: DocumentField) => (e: ChangeEvent<HTMLInputElement>) => {
            setData(field, e.target.files?.[0] ?? null);
        };

    const hintFor = (field: DocumentField): string => {
        if (isReturning && field === 'form_138') {
            return 'No upload needed — the registrar will attach your child’s latest report card from EVIMS.';
        }

        if (documentsOnFile && isOnFile(documentsOnFile, field)) {
            return `On file from S.Y. ${documentsOnFile.schoolYear} — no need to upload again. PDF, JPG, or PNG · max 10MB`;
        }

        return 'PDF, JPG, or PNG · max 10MB';
    };

    return (
        <div>
            {viewingDocument && (
                <DocumentViewerDialog
                    title={viewingDocument.title}
                    url={`/storage/${viewingDocument.path}`}
                    isPdf={isPdfPath(viewingDocument.path)}
                    open={isViewingDocument}
                    onOpenChange={setIsViewingDocument}
                />
            )}

            <h2 className="mb-3 font-serif text-xl font-semibold text-[#1F2A24]">
                Supporting Documents
            </h2>
            <StepGuide>
                <span aria-live="polite">
                    {guideText(data, documentsOnFile)}
                </span>
            </StepGuide>

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
                const selectedFile = data[doc.field];
                const pathOnFile =
                    doc.field === 'form_138'
                        ? null
                        : documentsOnFile?.files?.[doc.field];
                // A returning student's document with no copy on file, shown
                // grayed out next to the ones they can view.
                const isMissingOnFile =
                    isReturning && !isDisabled && !pathOnFile;

                return (
                    <div
                        key={doc.field}
                        className={`mb-3 rounded-xl border border-[#1F2A24]/10 p-4 ${isDisabled || isMissingOnFile ? 'bg-[#1F2A24]/[0.03]' : ''}`}
                    >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                            <label
                                htmlFor={doc.field}
                                className={`block text-sm font-medium ${isDisabled || isMissingOnFile ? 'text-[#1F2A24]/50' : 'text-[#1F2A24]/80'}`}
                            >
                                {doc.label}
                                {isOnFile(documentsOnFile, doc.field) && (
                                    <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-[#2F6F4E]/10 px-2 py-0.5 text-xs font-semibold text-[#2F6F4E]">
                                        <FileCheck2
                                            className="h-3 w-3"
                                            aria-hidden="true"
                                        />
                                        On file
                                    </span>
                                )}
                                {isMissingOnFile && (
                                    <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-[#1F2A24]/10 px-2 py-0.5 text-xs font-semibold text-[#1F2A24]/55">
                                        <FileX2
                                            className="h-3 w-3"
                                            aria-hidden="true"
                                        />
                                        Not on file
                                    </span>
                                )}
                            </label>
                            {isReturning && !isDisabled && (
                                <button
                                    type="button"
                                    disabled={!pathOnFile}
                                    onClick={() => {
                                        if (!pathOnFile) {
                                            return;
                                        }

                                        setViewingDocument({
                                            title: doc.label,
                                            path: pathOnFile,
                                        });
                                        setIsViewingDocument(true);
                                    }}
                                    className="inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 text-xs font-semibold text-[#2F6F4E] hover:bg-[#2F6F4E]/5 hover:underline disabled:cursor-not-allowed disabled:text-[#1F2A24]/35 disabled:hover:bg-transparent disabled:hover:no-underline"
                                >
                                    <Eye
                                        className="h-3.5 w-3.5"
                                        aria-hidden="true"
                                    />
                                    View
                                    <span className="sr-only">
                                        {' '}
                                        {doc.label} on file
                                    </span>
                                </button>
                            )}
                        </div>
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
                        {selectedFile && (
                            <p className="mt-2 flex items-center gap-1.5 text-xs text-[#2F6F4E]">
                                <FileCheck2
                                    className="h-3.5 w-3.5 shrink-0"
                                    aria-hidden="true"
                                />
                                <span className="truncate">
                                    Selected: {selectedFile.name}
                                    {isOnFile(documentsOnFile, doc.field) &&
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
