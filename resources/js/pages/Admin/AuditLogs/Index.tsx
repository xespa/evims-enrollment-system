import { Head, Link, router } from '@inertiajs/react';
import { TriangleAlert } from 'lucide-react';
import auditLogRoutes from '@/routes/admin/audit-logs';

type AuditEntry = {
    id: number;
    action: string;
    action_label: string;
    is_warning: boolean;
    details: string | null;
    actor: { id: number; name: string; email: string } | null;
    subject: { label: string; url: string | null } | null;
    ip_address: string | null;
    created_at: string;
};

type PaginationLink = { url: string | null; label: string; active: boolean };

type Props = {
    entries: { data: AuditEntry[]; links: PaginationLink[]; total: number };
    filters: { action: string | null; user_id: number | string | null };
    actions: { value: string; label: string }[];
    staff: { id: number; name: string }[];
};

const SELECT_CLASS =
    'min-h-11 w-full min-w-0 rounded-lg border border-[#1F2A24]/15 bg-white px-3 py-2 text-sm text-[#1F2A24] focus:border-[#2F6F4E] focus:ring-2 focus:ring-[#2F6F4E]/30 focus:outline-none sm:min-h-10 sm:w-auto';

function formatWhen(value: string): string {
    return new Date(value).toLocaleString('en-PH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });
}

function ActionBadge({ entry }: { entry: AuditEntry }) {
    return (
        <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap ${
                entry.is_warning
                    ? 'bg-[#C6473B]/10 text-[#9A3329]'
                    : 'bg-[#2F6F4E]/10 text-[#2F6F4E]'
            }`}
        >
            {entry.is_warning && (
                <TriangleAlert className="size-3" aria-hidden="true" />
            )}
            {entry.action_label}
        </span>
    );
}

function Subject({ entry }: { entry: AuditEntry }) {
    if (!entry.subject) {
        return null;
    }

    return entry.subject.url ? (
        <Link
            href={entry.subject.url}
            className="font-medium text-[#2F6F4E] hover:underline"
        >
            {entry.subject.label}
        </Link>
    ) : (
        <span className="font-medium text-[#1F2A24]">
            {entry.subject.label}
        </span>
    );
}

/**
 * Read-only history of sign-ins, staff account changes, two-factor
 * changes, and document uploads.
 */
export default function Index({ entries, filters, actions, staff }: Props) {
    const changeFilter = (key: 'action' | 'user_id', value: string) => {
        router.get(
            auditLogRoutes.index.url(),
            { ...filters, [key]: value || undefined },
            { preserveState: true, replace: true },
        );
    };

    const hasFilters = !!filters.action || !!filters.user_id;

    return (
        <>
            <Head title="Audit Log" />

            <div className="bg-[#FBF8F2] px-4 py-8">
                <div className="mx-auto max-w-6xl">
                    <div className="mb-6">
                        <h1 className="font-serif text-2xl font-semibold text-[#1F2A24]">
                            Audit Log
                        </h1>
                        <p className="text-sm text-[#1F2A24]/70">
                            Sign-ins, staff account changes, two-factor changes,
                            and document uploads. Entries can't be edited or
                            deleted.
                        </p>
                    </div>

                    <div className="mb-4 rounded-2xl border border-[#1F2A24]/10 bg-white p-4">
                        <div className="grid grid-cols-1 gap-3 sm:flex sm:flex-wrap sm:items-center">
                            <select
                                aria-label="Filter by action"
                                value={filters.action ?? ''}
                                onChange={(e) =>
                                    changeFilter('action', e.target.value)
                                }
                                className={SELECT_CLASS}
                            >
                                <option value="">All actions</option>
                                {actions.map((action) => (
                                    <option
                                        key={action.value}
                                        value={action.value}
                                    >
                                        {action.label}
                                    </option>
                                ))}
                            </select>
                            <select
                                aria-label="Filter by staff member"
                                value={filters.user_id ?? ''}
                                onChange={(e) =>
                                    changeFilter('user_id', e.target.value)
                                }
                                className={SELECT_CLASS}
                            >
                                <option value="">All staff</option>
                                {staff.map((member) => (
                                    <option key={member.id} value={member.id}>
                                        {member.name}
                                    </option>
                                ))}
                            </select>
                            <p
                                aria-live="polite"
                                className="text-sm text-[#1F2A24]/65 sm:ml-auto"
                            >
                                {entries.total}{' '}
                                {entries.total === 1 ? 'entry' : 'entries'}
                                {hasFilters && (
                                    <>
                                        {' · '}
                                        <Link
                                            href={auditLogRoutes.index.url()}
                                            className="font-semibold text-[#2F6F4E] hover:underline"
                                        >
                                            Clear filters
                                        </Link>
                                    </>
                                )}
                            </p>
                        </div>
                    </div>

                    {/* Cards (phones) */}
                    <ul className="space-y-3 md:hidden">
                        {entries.data.map((entry) => (
                            <li
                                key={entry.id}
                                className="rounded-2xl border border-[#1F2A24]/10 bg-white p-4 text-sm"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <ActionBadge entry={entry} />
                                    <time
                                        dateTime={entry.created_at}
                                        className="text-right text-xs text-[#1F2A24]/60"
                                    >
                                        {formatWhen(entry.created_at)}
                                    </time>
                                </div>
                                <p className="mt-3 text-[#1F2A24]">
                                    <span className="font-medium">
                                        {entry.actor?.name ?? 'Unknown'}
                                    </span>
                                    {entry.subject && (
                                        <>
                                            {' → '}
                                            <Subject entry={entry} />
                                        </>
                                    )}
                                </p>
                                {entry.details && (
                                    <p className="mt-1 text-[#1F2A24]/70">
                                        {entry.details}
                                    </p>
                                )}
                                {entry.ip_address && (
                                    <p className="mt-2 font-mono text-xs text-[#1F2A24]/50">
                                        {entry.ip_address}
                                    </p>
                                )}
                            </li>
                        ))}
                        {entries.data.length === 0 && (
                            <li className="rounded-2xl border border-[#1F2A24]/10 bg-white px-4 py-8 text-center text-sm text-[#1F2A24]/65">
                                No entries found.
                            </li>
                        )}
                    </ul>

                    {/* Table (tablets and up) */}
                    <div className="hidden overflow-x-auto rounded-2xl border border-[#1F2A24]/10 bg-white md:block">
                        <table className="min-w-full divide-y divide-[#1F2A24]/10 text-sm">
                            <thead className="bg-[#2F6F4E]/5">
                                <tr>
                                    <th className="px-4 py-3 text-left font-semibold text-[#1F2A24]/70">
                                        When
                                    </th>
                                    <th className="px-4 py-3 text-left font-semibold text-[#1F2A24]/70">
                                        Who
                                    </th>
                                    <th className="px-4 py-3 text-left font-semibold text-[#1F2A24]/70">
                                        What
                                    </th>
                                    <th className="px-4 py-3 text-left font-semibold text-[#1F2A24]/70">
                                        IP address
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#1F2A24]/10">
                                {entries.data.map((entry) => (
                                    <tr
                                        key={entry.id}
                                        className="align-top hover:bg-[#2F6F4E]/5"
                                    >
                                        <td className="px-4 py-3 whitespace-nowrap text-[#1F2A24]/70">
                                            <time dateTime={entry.created_at}>
                                                {formatWhen(entry.created_at)}
                                            </time>
                                        </td>
                                        <td className="px-4 py-3">
                                            <p className="font-medium text-[#1F2A24]">
                                                {entry.actor?.name ?? 'Unknown'}
                                            </p>
                                            {entry.actor && (
                                                <p className="text-xs text-[#1F2A24]/60">
                                                    {entry.actor.email}
                                                </p>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <ActionBadge entry={entry} />
                                            {(entry.subject ||
                                                entry.details) && (
                                                <p className="mt-1 text-[#1F2A24]/70">
                                                    <Subject entry={entry} />
                                                    {entry.subject &&
                                                        entry.details &&
                                                        ' · '}
                                                    {entry.details}
                                                </p>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 font-mono text-xs text-[#1F2A24]/60">
                                            {entry.ip_address ?? '—'}
                                        </td>
                                    </tr>
                                ))}
                                {entries.data.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={4}
                                            className="px-4 py-8 text-center text-[#1F2A24]/65"
                                        >
                                            No entries found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                        {entries.links.map((link, i) => (
                            <Link
                                key={i}
                                href={link.url ?? '#'}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                                preserveScroll
                                className={`inline-flex min-h-10 min-w-10 items-center justify-center rounded-full border px-3 py-1.5 text-sm ${
                                    link.active
                                        ? 'border-[#2F6F4E] bg-[#2F6F4E] text-white'
                                        : 'border-[#1F2A24]/10 bg-white text-[#1F2A24]/70 hover:bg-[#1F2A24]/5'
                                } ${!link.url ? 'pointer-events-none opacity-40' : ''}`}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
}
