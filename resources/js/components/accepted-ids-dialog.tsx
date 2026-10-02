import { CheckCircle2, IdCard, XCircle } from 'lucide-react';
import type { ReactNode } from 'react';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';

const GOVERNMENT_IDS = [
    'PhilSys National ID / ePhilID',
    'Passport',
    "Driver's License",
    'UMID',
    'SSS ID',
    'GSIS eCard',
    'PRC ID',
    'Postal ID',
    "Voter's ID",
    'PhilHealth ID',
    'TIN ID',
    'Senior Citizen ID',
    'PWD ID',
];

const PHOTO_DOS = [
    'The whole ID is in the photo, all four corners visible',
    'Sharp and well-lit — every word is readable',
    'The name matches the name on your account',
    'Not expired',
];

const PHOTO_DONTS = [
    'Blurry, dark, or with glare over the details',
    'Cropped, folded, or covered by fingers',
    'A photocopy of a photocopy, or a screenshot of a screenshot',
];

/**
 * Explains which IDs the school accepts and how to photograph one, so an
 * account isn't rejected for a blurry or unaccepted ID.
 */
export default function AcceptedIdsDialog({ trigger }: { trigger: ReactNode }) {
    return (
        <Dialog>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent className="flex max-h-[85vh] flex-col gap-0 rounded-2xl border-[#1F2A24]/10 bg-white p-0 text-[#1F2A24] sm:max-w-lg">
                <DialogHeader className="border-b border-[#1F2A24]/10 px-6 py-4 pr-12 text-left">
                    <DialogTitle className="flex items-center gap-2 font-serif text-xl font-semibold">
                        <IdCard
                            className="h-5 w-5 text-[#2F6F4E]"
                            aria-hidden="true"
                        />
                        Accepted IDs
                    </DialogTitle>
                    <DialogDescription className="text-[#1F2A24]/65">
                        One valid ID is enough. Upload a photo or scan (PDF,
                        JPG, or PNG, up to 10MB).
                    </DialogDescription>
                </DialogHeader>

                <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5 text-sm">
                    <section>
                        <h3 className="mb-2 font-semibold">
                            Parents and guardians — any government-issued ID
                        </h3>
                        <ul className="grid grid-cols-1 gap-x-4 gap-y-1 text-[#1F2A24]/80 sm:grid-cols-2">
                            {GOVERNMENT_IDS.map((id) => (
                                <li key={id} className="flex gap-2">
                                    <span
                                        className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[#2F6F4E]"
                                        aria-hidden="true"
                                    />
                                    {id}
                                </li>
                            ))}
                        </ul>
                    </section>

                    <section>
                        <h3 className="mb-1 font-semibold">Students</h3>
                        <p className="text-[#1F2A24]/80">
                            Your current school ID, or any government-issued ID
                            above.
                        </p>
                    </section>

                    <section className="rounded-xl bg-[#FBF8F2] p-4">
                        <h3 className="mb-2 font-semibold">
                            Make sure your photo is clear
                        </h3>
                        <ul className="space-y-1.5">
                            {PHOTO_DOS.map((tip) => (
                                <li
                                    key={tip}
                                    className="flex gap-2 text-[#1F2A24]/80"
                                >
                                    <CheckCircle2
                                        className="mt-0.5 h-4 w-4 shrink-0 text-[#2F6F4E]"
                                        aria-hidden="true"
                                    />
                                    {tip}
                                </li>
                            ))}
                            {PHOTO_DONTS.map((tip) => (
                                <li
                                    key={tip}
                                    className="flex gap-2 text-[#1F2A24]/80"
                                >
                                    <XCircle
                                        className="mt-0.5 h-4 w-4 shrink-0 text-[#C6473B]"
                                        aria-hidden="true"
                                    />
                                    {tip}
                                </li>
                            ))}
                        </ul>
                        <p className="mt-3 text-xs text-[#1F2A24]/60">
                            If important details are on the back, upload a PDF
                            with both sides.
                        </p>
                    </section>
                </div>

                <div className="flex justify-end border-t border-[#1F2A24]/10 px-6 py-3">
                    <DialogClose asChild>
                        <button
                            type="button"
                            className="min-h-10 rounded-full bg-[#2F6F4E] px-5 text-sm font-semibold text-[#FBF8F2] hover:bg-[#25573E]"
                        >
                            Got it
                        </button>
                    </DialogClose>
                </div>
            </DialogContent>
        </Dialog>
    );
}
