import { useInitials } from '@/hooks/use-initials';
import { cn } from '@/lib/utils';

/**
 * A staff member's profile photo, or their initials when they haven't
 * uploaded one. Size it with a `size-*` class.
 */
export default function AdminAvatar({
    name,
    photoUrl,
    className,
}: {
    name: string;
    photoUrl?: string | null;
    className?: string;
}) {
    const getInitials = useInitials();

    return photoUrl ? (
        <img
            src={photoUrl}
            alt=""
            className={cn('shrink-0 rounded-full object-cover', className)}
        />
    ) : (
        <span
            aria-hidden="true"
            className={cn(
                'flex shrink-0 items-center justify-center rounded-full bg-[#2F6F4E] font-semibold text-white',
                className,
            )}
        >
            {getInitials(name)}
        </span>
    );
}
