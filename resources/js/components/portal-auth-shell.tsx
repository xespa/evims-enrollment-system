import { CheckCircle2 } from 'lucide-react';
import type { ReactNode } from 'react';

type Props = {
    title: string;
    description: string;
    /**
     * Short points for a brand panel beside the form on wide screens. Leave
     * out for a single compact card (e.g. log in).
     */
    highlights?: string[];
    /** Shown above the form, e.g. why the visitor was sent here. */
    notice?: ReactNode;
    footer?: ReactNode;
    children: ReactNode;
};

function Logo({ inverted = false }: { inverted?: boolean }) {
    return (
        <div className="flex items-center gap-2.5">
            <img
                src="/images/logoevims.png"
                alt=""
                className="h-9 w-9 rounded-full bg-white object-cover"
            />
            <div className="leading-tight">
                <p
                    className={`font-serif text-base font-semibold ${inverted ? 'text-[#FBF8F2]' : 'text-[#1F2A24]'}`}
                >
                    EVIMS
                </p>
                <p
                    className={`text-[11px] ${inverted ? 'text-[#FBF8F2]/75' : 'text-[#1F2A24]/60'}`}
                >
                    Student Portal
                </p>
            </div>
        </div>
    );
}

/**
 * The frame shared by the portal's log in and register pages: a compact
 * card, or — with highlights — a brand panel beside the form on desktop.
 */
export default function PortalAuthShell({
    title,
    description,
    highlights,
    notice,
    footer,
    children,
}: Props) {
    const isSplit = !!highlights?.length;

    return (
        <div className="flex justify-center bg-[#FBF8F2] px-4 py-6 sm:py-8">
            <div
                className={`w-full overflow-hidden rounded-3xl border border-[#1F2A24]/10 bg-white shadow-lg shadow-[#1F2A24]/5 ${
                    isSplit
                        ? 'max-w-[54rem] lg:grid lg:grid-cols-[17rem_minmax(0,1fr)]'
                        : 'max-w-sm'
                }`}
            >
                {isSplit && (
                    <aside className="relative hidden flex-col overflow-hidden bg-[#2F6F4E] p-7 lg:flex">
                        <div
                            className="pointer-events-none absolute -right-16 -bottom-16 h-48 w-48 rounded-full bg-white/5"
                            aria-hidden="true"
                        />
                        <Logo inverted />

                        <ul className="relative mt-8 space-y-3.5">
                            {highlights.map((highlight) => (
                                <li
                                    key={highlight}
                                    className="flex items-start gap-2.5 text-[13px] leading-snug text-[#FBF8F2]/90"
                                >
                                    <CheckCircle2
                                        className="mt-px h-4 w-4 shrink-0 text-[#E8A33D]"
                                        aria-hidden="true"
                                    />
                                    {highlight}
                                </li>
                            ))}
                        </ul>

                        <p className="relative mt-auto pt-8 text-[11px] leading-snug text-[#FBF8F2]/60">
                            Eastern Visayas International Montessori School
                        </p>
                    </aside>
                )}

                <div className="p-6 sm:p-7">
                    <div
                        className={`mb-4 ${isSplit ? 'lg:hidden' : 'flex justify-center'}`}
                    >
                        <Logo />
                    </div>

                    <div className={`mb-4 ${isSplit ? '' : 'text-center'}`}>
                        <h1 className="font-serif text-xl font-semibold text-[#1F2A24] sm:text-2xl">
                            {title}
                        </h1>
                        <p className="mt-1 text-sm text-[#1F2A24]/65">
                            {description}
                        </p>
                    </div>

                    {notice}

                    {children}

                    {footer && (
                        <p className="mt-4 text-center text-sm text-[#1F2A24]/65">
                            {footer}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
