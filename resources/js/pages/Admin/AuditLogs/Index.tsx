import { Head, Link, router, setLayoutProps } from '@inertiajs/react';
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
    'min-h-11 w-full min-w-0 rounded-lg border border-ink/15 bg-surface px-3 py-2 text-sm text-ink focus:border-brand focus:ring-2 focus:ring-brand/30 focus:outline-none sm:min-h-10 sm:w-auto';

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
                    ? 'bg-danger/10 text-danger-deep'
                    : 'bg-brand/10 text-brand-ink'
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
            className="font-medium text-brand-ink hover:underline"
        >
            {entry.subject.label}
        </Link>
    ) : (
        <span className="font-medium text-ink">{entry.subject.label}</span>
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
    setLayoutProps({ title: 'Audit Log' });

    return (
        <>
            <Head title="Audit Log" />

            <div className="bg-cream px-4 py-8">
                <div className="mx-auto max-w-6xl">
                    <div className="mb-4 rounded-2xl border border-ink/10 bg-surface p-4">
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
                                className="text-sm text-ink/65 sm:ml-auto"
                            >
                                {entries.total}{' '}
                                {entries.total === 1 ? 'entry' : 'entries'}
                                {hasFilters && (
                                    <>
                                        {' · '}
                                        <Link
                                            href={auditLogRoutes.index.url()}
                                            className="font-semibold text-brand-ink hover:underline"
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
                                className="rounded-2xl border border-ink/10 bg-surface p-4 text-sm"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <ActionBadge entry={entry} />
                                    <time
                                        dateTime={entry.created_at}
                                        className="text-right text-xs text-ink/60"
                                    >
                                        {formatWhen(entry.created_at)}
                                    </time>
                                </div>
                                <p className="mt-3 text-ink">
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
                                    <p className="mt-1 text-ink/70">
                                        {entry.details}
                                    </p>
                                )}
                                {entry.ip_address && (
                                    <p className="mt-2 font-mono text-xs text-ink/50">
                                        {entry.ip_address}
                                    </p>
                                )}
                            </li>
                        ))}
                        {entries.data.length === 0 && (
                            <li className="rounded-2xl border border-ink/10 bg-surface px-4 py-8 text-center text-sm text-ink/65">
                                No entries found.
                            </li>
                        )}
                    </ul>

                    {/* Table (tablets and up) */}
                    <div className="hidden overflow-x-auto rounded-2xl border border-ink/10 bg-surface md:block">
                        <table className="min-w-full divide-y divide-ink/10 text-sm">
                            <thead className="bg-brand/5">
                                <tr>
                                    <th className="px-4 py-3 text-left font-semibold text-ink/70">
                                        When
                                    </th>
                                    <th className="px-4 py-3 text-left font-semibold text-ink/70">
                                        Who
                                    </th>
                                    <th className="px-4 py-3 text-left font-semibold text-ink/70">
                                        What
                                    </th>
                                    <th className="px-4 py-3 text-left font-semibold text-ink/70">
                                        IP address
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-ink/10">
                                {entries.data.map((entry) => (
                                    <tr
                                        key={entry.id}
                                        className="align-top hover:bg-brand/5"
                                    >
                                        <td className="px-4 py-3 whitespace-nowrap text-ink/70">
                                            <time dateTime={entry.created_at}>
                                                {formatWhen(entry.created_at)}
                                            </time>
                                        </td>
                                        <td className="px-4 py-3">
                                            <p className="font-medium text-ink">
                                                {entry.actor?.name ?? 'Unknown'}
                                            </p>
                                            {entry.actor && (
                                                <p className="text-xs text-ink/60">
                                                    {entry.actor.email}
                                                </p>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <ActionBadge entry={entry} />
                                            {(entry.subject ||
                                                entry.details) && (
                                                <p className="mt-1 text-ink/70">
                                                    <Subject entry={entry} />
                                                    {entry.subject &&
                                                        entry.details &&
                                                        ' · '}
                                                    {entry.details}
                                                </p>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 font-mono text-xs text-ink/60">
                                            {entry.ip_address ?? '—'}
                                        </td>
                                    </tr>
                                ))}
                                {entries.data.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={4}
                                            className="px-4 py-8 text-center text-ink/65"
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
                                        ? 'border-brand bg-brand text-white'
                                        : 'border-ink/10 bg-surface text-ink/70 hover:bg-ink/5'
                                } ${!link.url ? 'pointer-events-none opacity-40' : ''}`}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
}
