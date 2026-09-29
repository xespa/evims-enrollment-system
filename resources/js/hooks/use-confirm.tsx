import { useCallback, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogTitle,
} from '@/components/ui/dialog';

export type ConfirmOptions = {
    title: string;
    description?: ReactNode;
    confirmLabel?: string;
    cancelLabel?: string;
    destructive?: boolean;
};

/**
 * Promise-based replacement for window.confirm() that renders a styled,
 * accessible dialog. Render the returned element once in the component.
 *
 *     const [confirm, confirmDialog] = useConfirm();
 *     if (!(await confirm({ title: 'Delete this?' }))) return;
 */
export function useConfirm(): [
    (options: ConfirmOptions) => Promise<boolean>,
    ReactNode,
] {
    const [open, setOpen] = useState(false);
    // Kept after closing so the text doesn't vanish mid fade-out.
    const [options, setOptions] = useState<ConfirmOptions | null>(null);
    const resolverRef = useRef<((confirmed: boolean) => void) | null>(null);

    const confirm = useCallback(
        (nextOptions: ConfirmOptions) =>
            new Promise<boolean>((resolve) => {
                resolverRef.current = resolve;
                setOptions(nextOptions);
                setOpen(true);
            }),
        [],
    );

    const settle = (confirmed: boolean) => {
        resolverRef.current?.(confirmed);
        resolverRef.current = null;
        setOpen(false);
    };

    const dialog = (
        <Dialog
            open={open}
            onOpenChange={(isOpen) => {
                if (!isOpen) {
                    settle(false);
                }
            }}
        >
            <DialogContent className="rounded-2xl border-[#1F2A24]/10 bg-white text-[#1F2A24] sm:max-w-md">
                <DialogTitle className="font-serif text-lg font-semibold">
                    {options?.title}
                </DialogTitle>
                {options?.description && (
                    <DialogDescription className="text-sm leading-relaxed text-[#1F2A24]/75">
                        {options.description}
                    </DialogDescription>
                )}
                <DialogFooter className="gap-2 sm:gap-2">
                    <button
                        type="button"
                        onClick={() => settle(false)}
                        className="min-h-10 rounded-full border border-[#1F2A24]/15 bg-white px-5 py-2 text-sm font-semibold text-[#1F2A24]/80 transition-colors hover:bg-[#1F2A24]/5"
                    >
                        {options?.cancelLabel ?? 'Cancel'}
                    </button>
                    <button
                        type="button"
                        onClick={() => settle(true)}
                        className={`min-h-10 rounded-full px-5 py-2 text-sm font-semibold text-white shadow-sm transition-colors ${
                            options?.destructive
                                ? 'bg-[#C6473B] hover:bg-[#A83A30]'
                                : 'bg-[#2F6F4E] hover:bg-[#25573E]'
                        }`}
                    >
                        {options?.confirmLabel ?? 'Confirm'}
                    </button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );

    return [confirm, dialog];
}
