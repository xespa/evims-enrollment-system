import { CalendarDays, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useState } from 'react';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

/** Dates travel as 'YYYY-MM-DD' strings ('' when unset), like <input type="date">. */
export type DateRange = { from: string; to: string };

type Props = DateRange & {
    onChange: (range: DateRange) => void;
    /** Days after this can't be picked. Defaults to today. */
    maxDate?: Date;
    label?: string;
};

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function startOfDay(date: Date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

function addMonths(date: Date, months: number) {
    return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

/** Local-time 'YYYY-MM-DD' — toISOString() would shift the day across UTC. */
function toKey(date: Date) {
    const pad = (n: number) => String(n).padStart(2, '0');

    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function fromKey(key: string) {
    const [year, month, day] = key.split('-').map(Number);

    return new Date(year, month - 1, day);
}

function formatKey(key: string) {
    return fromKey(key).toLocaleDateString('en-PH', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

function presets(today: Date): { label: string; range: DateRange }[] {
    const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const firstOfLastMonth = addMonths(firstOfMonth, -1);

    return [
        { label: 'Today', range: { from: toKey(today), to: toKey(today) } },
        {
            label: 'Last 7 days',
            range: { from: toKey(addDays(today, -6)), to: toKey(today) },
        },
        {
            label: 'Last 30 days',
            range: { from: toKey(addDays(today, -29)), to: toKey(today) },
        },
        {
            label: 'This month',
            range: { from: toKey(firstOfMonth), to: toKey(today) },
        },
        {
            label: 'Last month',
            range: {
                from: toKey(firstOfLastMonth),
                to: toKey(addDays(firstOfMonth, -1)),
            },
        },
    ];
}

function MonthGrid({
    month,
    from,
    rangeEnd,
    maxKey,
    onPick,
    onHover,
}: {
    month: Date;
    from: string;
    /** The committed end date, or the hovered day while picking one. */
    rangeEnd: string;
    maxKey: string;
    onPick: (key: string) => void;
    onHover: (key: string) => void;
}) {
    const leadingBlanks = month.getDay();
    const daysInMonth = new Date(
        month.getFullYear(),
        month.getMonth() + 1,
        0,
    ).getDate();

    const [low, high] =
        from && rangeEnd && rangeEnd < from
            ? [rangeEnd, from]
            : [from, rangeEnd];

    return (
        <div className="w-[15.5rem]">
            <p className="mb-2 text-center text-sm font-semibold text-[#1F2A24]">
                {month.toLocaleDateString('en-PH', {
                    month: 'long',
                    year: 'numeric',
                })}
            </p>
            <div className="grid grid-cols-7 text-center text-xs font-medium text-[#1F2A24]/50">
                {WEEKDAYS.map((day) => (
                    <span key={day} className="py-1">
                        {day}
                    </span>
                ))}
            </div>
            <div className="grid grid-cols-7">
                {Array.from({ length: leadingBlanks }, (_, i) => (
                    <span key={`blank-${i}`} />
                ))}
                {Array.from({ length: daysInMonth }, (_, i) => {
                    const date = new Date(
                        month.getFullYear(),
                        month.getMonth(),
                        i + 1,
                    );
                    const key = toKey(date);
                    const isDisabled = key > maxKey;
                    const isEndpoint = key === low || key === high;
                    const isBetween =
                        !!low && !!high && key > low && key < high;

                    return (
                        <button
                            key={key}
                            type="button"
                            disabled={isDisabled}
                            onClick={() => onPick(key)}
                            onMouseEnter={() => onHover(key)}
                            onFocus={() => onHover(key)}
                            aria-label={date.toLocaleDateString('en-PH', {
                                weekday: 'long',
                                month: 'long',
                                day: 'numeric',
                                year: 'numeric',
                            })}
                            aria-pressed={isEndpoint}
                            className={`h-9 text-sm tabular-nums transition-colors focus-visible:relative focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-[#2F6F4E]/40 focus-visible:outline-none disabled:cursor-not-allowed disabled:text-[#1F2A24]/25 ${
                                isEndpoint
                                    ? 'rounded-full bg-[#2F6F4E] font-semibold text-white'
                                    : isBetween
                                      ? 'bg-[#2F6F4E]/10 text-[#1F2A24]'
                                      : 'rounded-full text-[#1F2A24] enabled:hover:bg-[#1F2A24]/5'
                            }`}
                        >
                            {i + 1}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

/**
 * A date-range filter that opens a two-month calendar in a modal: click the
 * first day, then the last. Built in-house so it doesn't need a date-picker
 * dependency; the modal itself is the app's shared Dialog.
 */
export default function DateRangePicker({
    from,
    to,
    onChange,
    maxDate,
    label = 'Date',
}: Props) {
    const today = startOfDay(maxDate ?? new Date());
    const maxKey = toKey(today);

    const [isOpen, setIsOpen] = useState(false);
    // While open, the picker works on its own copy so a half-picked range
    // (start chosen, end not yet) never triggers a search.
    const [draftFrom, setDraftFrom] = useState(from);
    const [draftTo, setDraftTo] = useState(to);
    const [hovered, setHovered] = useState('');
    // The left-hand month; the right one is the month after it.
    const [viewMonth, setViewMonth] = useState(() =>
        addMonths(to ? fromKey(to) : today, -1),
    );

    const open = () => {
        setDraftFrom(from);
        setDraftTo(to);
        setHovered('');
        setViewMonth(addMonths(to ? fromKey(to) : today, -1));
        setIsOpen(true);
    };

    const commit = (range: DateRange) => {
        setIsOpen(false);
        onChange(range);
    };

    const pick = (key: string) => {
        // First click (or starting over after a full range): set the start.
        if (!draftFrom || draftTo) {
            setDraftFrom(key);
            setDraftTo('');

            return;
        }

        // Second click finishes the range — in either direction.
        commit(
            key < draftFrom
                ? { from: key, to: draftFrom }
                : { from: draftFrom, to: key },
        );
    };

    const summary =
        from && to
            ? from === to
                ? formatKey(from)
                : `${formatKey(from)} – ${formatKey(to)}`
            : from
              ? `From ${formatKey(from)}`
              : to
                ? `Until ${formatKey(to)}`
                : 'Any date';

    const hasValue = !!(from || to);
    const pickingEnd = !!draftFrom && !draftTo;

    return (
        <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-[#1F2A24]/60">
                {label}
            </span>
            <div className="flex">
                <button
                    type="button"
                    onClick={open}
                    aria-haspopup="dialog"
                    className={`inline-flex min-h-10 items-center gap-2 border border-[#1F2A24]/15 bg-white px-3 py-2 text-sm whitespace-nowrap focus:border-[#2F6F4E] focus:ring-2 focus:ring-[#2F6F4E]/30 focus:outline-none ${
                        hasValue
                            ? 'rounded-l-lg text-[#1F2A24]'
                            : 'rounded-lg text-[#1F2A24]/60'
                    }`}
                >
                    <CalendarDays
                        className="h-4 w-4 text-[#1F2A24]/50"
                        aria-hidden="true"
                    />
                    {summary}
                </button>
                {hasValue && (
                    <button
                        type="button"
                        onClick={() => commit({ from: '', to: '' })}
                        aria-label="Clear date range"
                        className="inline-flex min-h-10 items-center rounded-r-lg border border-l-0 border-[#1F2A24]/15 bg-white px-2 text-[#1F2A24]/50 hover:text-[#1F2A24] focus:ring-2 focus:ring-[#2F6F4E]/30 focus:outline-none"
                    >
                        <X className="h-4 w-4" aria-hidden="true" />
                    </button>
                )}
            </div>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="max-h-[calc(100vh-2rem)] gap-0 overflow-y-auto rounded-2xl border-[#1F2A24]/10 bg-white p-0 sm:max-w-fit">
                    <DialogHeader className="border-b border-[#1F2A24]/10 px-5 py-4 pr-12 text-left">
                        <DialogTitle className="font-serif text-lg text-[#1F2A24]">
                            Choose a date range
                        </DialogTitle>
                        <DialogDescription
                            className="text-sm text-[#1F2A24]/60"
                            aria-live="polite"
                        >
                            {pickingEnd
                                ? `Starting ${formatKey(draftFrom)} — now pick the last day.`
                                : 'Pick the first day, then the last day.'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex flex-col sm:flex-row">
                        <ul className="flex gap-1 overflow-x-auto border-b border-[#1F2A24]/10 p-2 sm:flex-col sm:border-r sm:border-b-0">
                            {presets(today).map((preset) => (
                                <li key={preset.label}>
                                    <button
                                        type="button"
                                        onClick={() => commit(preset.range)}
                                        className="min-h-9 w-full rounded-lg px-3 text-left text-sm whitespace-nowrap text-[#1F2A24]/80 hover:bg-[#2F6F4E]/5 hover:text-[#2F6F4E]"
                                    >
                                        {preset.label}
                                    </button>
                                </li>
                            ))}
                        </ul>

                        <div className="relative flex justify-center p-4">
                            <button
                                type="button"
                                onClick={() =>
                                    setViewMonth((m) => addMonths(m, -1))
                                }
                                aria-label="Previous month"
                                className="absolute top-4 left-4 inline-flex h-7 w-7 items-center justify-center rounded-full text-[#1F2A24]/60 hover:bg-[#1F2A24]/5"
                            >
                                <ChevronLeft
                                    className="h-4 w-4"
                                    aria-hidden="true"
                                />
                            </button>
                            <button
                                type="button"
                                onClick={() =>
                                    setViewMonth((m) => addMonths(m, 1))
                                }
                                // Stops once the current month is on the left, so it's
                                // always reachable, even on phones (one month shown).
                                disabled={viewMonth >= addMonths(today, 0)}
                                aria-label="Next month"
                                className="absolute top-4 right-4 inline-flex h-7 w-7 items-center justify-center rounded-full text-[#1F2A24]/60 hover:bg-[#1F2A24]/5 disabled:cursor-not-allowed disabled:opacity-30"
                            >
                                <ChevronRight
                                    className="h-4 w-4"
                                    aria-hidden="true"
                                />
                            </button>

                            <div
                                onMouseLeave={() => setHovered('')}
                                className="flex gap-6"
                            >
                                <MonthGrid
                                    month={viewMonth}
                                    from={draftFrom}
                                    rangeEnd={pickingEnd ? hovered : draftTo}
                                    maxKey={maxKey}
                                    onPick={pick}
                                    onHover={setHovered}
                                />
                                <div className="hidden sm:block">
                                    <MonthGrid
                                        month={addMonths(viewMonth, 1)}
                                        from={draftFrom}
                                        rangeEnd={
                                            pickingEnd ? hovered : draftTo
                                        }
                                        maxKey={maxKey}
                                        onPick={pick}
                                        onHover={setHovered}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-end gap-2 border-t border-[#1F2A24]/10 px-5 py-3">
                        {hasValue && (
                            <button
                                type="button"
                                onClick={() => commit({ from: '', to: '' })}
                                className="min-h-10 rounded-full px-4 text-sm font-medium text-[#1F2A24]/60 hover:text-[#1F2A24]"
                            >
                                Clear dates
                            </button>
                        )}
                        <DialogClose asChild>
                            <button
                                type="button"
                                className="min-h-10 rounded-full border border-[#1F2A24]/15 px-5 text-sm font-medium text-[#1F2A24] hover:bg-[#1F2A24]/5"
                            >
                                Cancel
                            </button>
                        </DialogClose>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
