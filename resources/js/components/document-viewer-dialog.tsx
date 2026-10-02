import {
    Download,
    ExternalLink,
    RotateCcw,
    ZoomIn,
    ZoomOut,
} from 'lucide-react';
import { useRef, useState } from 'react';
import type { KeyboardEvent, PointerEvent, WheelEvent } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

const MIN_SCALE = 1;
const MAX_SCALE = 5;
const ZOOM_STEP = 1.25;

type Point = { x: number; y: number };

interface DocumentViewerDialogProps {
    title: string;
    url: string;
    isPdf: boolean;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function isPdfPath(path: string) {
    return /\.pdf$/i.test(path.split('?')[0]);
}

function distanceBetween([a, b]: Point[]) {
    return Math.hypot(a.x - b.x, a.y - b.y);
}

/**
 * "documents/abc.png" → "Form 138.png", so downloads get a readable name.
 * Without an extension in the URL, an empty name lets the browser use the
 * filename the server sends.
 */
function downloadName(title: string, url: string) {
    const extension = url.split('?')[0].match(/\.(\w+)$/)?.[1];

    return extension ? `${title}.${extension}` : '';
}

/**
 * Shows an uploaded document in a modal. Images can be zoomed with the
 * buttons, the mouse wheel, a double-click or a pinch, and dragged around
 * once zoomed in. PDFs use the browser's own viewer, which has its own zoom.
 */
export default function DocumentViewerDialog({
    title,
    url,
    isPdf,
    open,
    onOpenChange,
}: DocumentViewerDialogProps) {
    const [scale, setScale] = useState(MIN_SCALE);
    const [offset, setOffset] = useState<Point>({ x: 0, y: 0 });
    const pointers = useRef(new Map<number, Point>());
    const pinchStart = useRef<{ distance: number; scale: number } | null>(null);

    const zoomTo = (nextScale: number) => {
        const clamped = Math.min(MAX_SCALE, Math.max(MIN_SCALE, nextScale));
        setScale(clamped);
        if (clamped === MIN_SCALE) {
            setOffset({ x: 0, y: 0 });
        }
    };

    const resetZoom = () => zoomTo(MIN_SCALE);

    const close = (isOpen: boolean) => {
        if (!isOpen) {
            resetZoom();
            pointers.current.clear();
            pinchStart.current = null;
        }
        onOpenChange(isOpen);
    };

    const handleWheel = (e: WheelEvent) => {
        zoomTo(e.deltaY < 0 ? scale * ZOOM_STEP : scale / ZOOM_STEP);
    };

    const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

        if (pointers.current.size === 2) {
            pinchStart.current = {
                distance: distanceBetween([...pointers.current.values()]),
                scale,
            };
        }
    };

    const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
        const previous = pointers.current.get(e.pointerId);
        if (!previous) {
            return;
        }
        pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

        if (pointers.current.size === 2 && pinchStart.current) {
            const distance = distanceBetween([...pointers.current.values()]);
            zoomTo(
                (pinchStart.current.scale * distance) /
                    pinchStart.current.distance,
            );
        } else if (pointers.current.size === 1 && scale > MIN_SCALE) {
            setOffset((current) => ({
                x: current.x + e.clientX - previous.x,
                y: current.y + e.clientY - previous.y,
            }));
        }
    };

    const handlePointerUp = (e: PointerEvent<HTMLDivElement>) => {
        pointers.current.delete(e.pointerId);
        if (pointers.current.size < 2) {
            pinchStart.current = null;
        }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
        if (isPdf) {
            return;
        }
        if (e.key === '+' || e.key === '=') {
            zoomTo(scale * ZOOM_STEP);
        } else if (e.key === '-') {
            zoomTo(scale / ZOOM_STEP);
        } else if (e.key === '0') {
            resetZoom();
        }
    };

    const toolbarButton =
        'inline-flex min-h-9 min-w-9 items-center justify-center rounded-full text-[#1F2A24]/75 transition-colors hover:bg-[#1F2A24]/5 hover:text-[#1F2A24] disabled:cursor-not-allowed disabled:opacity-40';

    return (
        <Dialog open={open} onOpenChange={close}>
            <DialogContent
                onKeyDown={handleKeyDown}
                className="flex h-[90vh] flex-col gap-0 overflow-hidden rounded-2xl border-[#1F2A24]/10 bg-white p-0 text-[#1F2A24] sm:max-w-4xl"
            >
                <DialogHeader className="flex flex-row flex-wrap items-center justify-between gap-2 border-b border-[#1F2A24]/10 px-4 py-3 pr-12 text-left">
                    <DialogTitle className="font-serif text-lg font-semibold">
                        {title}
                    </DialogTitle>
                    <DialogDescription className="sr-only">
                        {isPdf
                            ? 'Preview of the uploaded PDF.'
                            : 'Preview of the uploaded image. Use the zoom buttons, mouse wheel, double-click or pinch to zoom, and drag to move around.'}
                    </DialogDescription>

                    <div className="flex items-center gap-1">
                        {!isPdf && (
                            <>
                                <button
                                    type="button"
                                    onClick={() => zoomTo(scale / ZOOM_STEP)}
                                    disabled={scale <= MIN_SCALE}
                                    aria-label="Zoom out"
                                    className={toolbarButton}
                                >
                                    <ZoomOut
                                        className="h-4 w-4"
                                        aria-hidden="true"
                                    />
                                </button>
                                <span
                                    className="w-12 text-center text-xs text-[#1F2A24]/70 tabular-nums"
                                    aria-live="polite"
                                >
                                    {Math.round(scale * 100)}%
                                </span>
                                <button
                                    type="button"
                                    onClick={() => zoomTo(scale * ZOOM_STEP)}
                                    disabled={scale >= MAX_SCALE}
                                    aria-label="Zoom in"
                                    className={toolbarButton}
                                >
                                    <ZoomIn
                                        className="h-4 w-4"
                                        aria-hidden="true"
                                    />
                                </button>
                                <button
                                    type="button"
                                    onClick={resetZoom}
                                    disabled={scale === MIN_SCALE}
                                    aria-label="Reset zoom"
                                    className={toolbarButton}
                                >
                                    <RotateCcw
                                        className="h-4 w-4"
                                        aria-hidden="true"
                                    />
                                </button>
                            </>
                        )}
                        {isPdf && (
                            <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="Open in a new tab"
                                className={toolbarButton}
                            >
                                <ExternalLink
                                    className="h-4 w-4"
                                    aria-hidden="true"
                                />
                            </a>
                        )}
                        <a
                            href={url}
                            download={downloadName(title, url)}
                            className="ml-1 inline-flex min-h-9 items-center gap-1.5 rounded-full bg-[#2F6F4E] px-4 text-xs font-semibold text-white transition-colors hover:bg-[#25573E]"
                        >
                            <Download className="h-4 w-4" aria-hidden="true" />
                            Download
                        </a>
                    </div>
                </DialogHeader>

                {isPdf ? (
                    <iframe
                        src={url}
                        title={title}
                        className="min-h-0 flex-1 bg-[#1F2A24]/5"
                    />
                ) : (
                    <div
                        onWheel={handleWheel}
                        onPointerDown={handlePointerDown}
                        onPointerMove={handlePointerMove}
                        onPointerUp={handlePointerUp}
                        onPointerCancel={handlePointerUp}
                        onDoubleClick={() =>
                            zoomTo(scale > MIN_SCALE ? MIN_SCALE : 2.5)
                        }
                        className={`flex min-h-0 flex-1 touch-none items-center justify-center overflow-hidden bg-[#1F2A24]/5 select-none ${scale > MIN_SCALE ? 'cursor-grab active:cursor-grabbing' : 'cursor-zoom-in'}`}
                    >
                        <img
                            src={url}
                            alt={title}
                            draggable={false}
                            style={{
                                transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
                            }}
                            className="max-h-full max-w-full object-contain transition-transform duration-75"
                        />
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
