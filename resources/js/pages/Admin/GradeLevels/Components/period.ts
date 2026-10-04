import type { EnrollmentPeriod } from './types';

export function formatDate(date: string) {
    return new Date(`${date}T00:00:00`).toLocaleDateString('en-PH', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

/** Whole days from one Y-m-d date to another. */
function daysBetween(from: string, to: string) {
    const toUtc = (date: string) => {
        const [year, month, day] = date.split('-').map(Number);

        return Date.UTC(year, month - 1, day);
    };

    return Math.round((toUtc(to) - toUtc(from)) / 86_400_000);
}

function inDays(days: number) {
    if (days === 0) return 'today';
    if (days === 1) return 'tomorrow';

    return `in ${days} days`;
}

/** A short label (and colours) for where today falls in the period. */
export function periodStatus(period: EnrollmentPeriod, today: string) {
    if (today < period.opens_on) {
        return {
            label: `Opens ${inDays(daysBetween(today, period.opens_on))}`,
            tone: 'bg-[#E8A33D]/15 text-[#a4670f]',
        };
    }

    if (today > period.closes_on) {
        return { label: 'Closed', tone: 'bg-[#C6473B]/10 text-[#9A3329]' };
    }

    return {
        label: `Open · closes ${inDays(daysBetween(today, period.closes_on))}`,
        tone: 'bg-[#2F6F4E]/10 text-[#2F6F4E]',
    };
}
