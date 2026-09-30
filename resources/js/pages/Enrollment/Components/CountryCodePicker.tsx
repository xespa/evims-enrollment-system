import { Fragment, useEffect, useId, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';
import {
    CALLING_COUNTRIES,
    DEFAULT_COUNTRY_ISO,
} from './country-calling-codes';
import type { CallingCountry } from './country-calling-codes';

type Props = {
    country: CallingCountry;
    onSelect: (country: CallingCountry) => void;
    /** What the picker is for, e.g. "Father's mobile number". */
    label: string;
};

/** Matches a country by name, ISO code, or calling code ("63", "+63"). */
function matchesSearch(country: CallingCountry, search: string): boolean {
    const term = search.trim().toLowerCase().replace(/^\+/, '');

    if (term === '') {
        return true;
    }

    return (
        country.name.toLowerCase().includes(term) ||
        country.iso.toLowerCase() === term ||
        country.code.startsWith(term)
    );
}

/**
 * The country calling code part of a mobile number field: a compact
 * "PH +63" button that opens a searchable list. Works by keyboard too —
 * arrows move, Enter picks, Escape closes and returns focus.
 */
export default function CountryCodePicker({ country, onSelect, label }: Props) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [activeIndex, setActiveIndex] = useState(0);

    const containerRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const searchRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLUListElement>(null);
    const listId = useId();

    const results = useMemo(
        () => CALLING_COUNTRIES.filter((c) => matchesSearch(c, search)),
        [search],
    );

    const open = () => {
        setSearch('');
        setActiveIndex(
            Math.max(
                0,
                CALLING_COUNTRIES.findIndex((c) => c.iso === country.iso),
            ),
        );
        setIsOpen(true);
    };

    const close = (returnFocus = true) => {
        setIsOpen(false);
        if (returnFocus) {
            triggerRef.current?.focus();
        }
    };

    const choose = (picked: CallingCountry) => {
        onSelect(picked);
        close();
    };

    useEffect(() => {
        if (isOpen) {
            searchRef.current?.focus();
        }
    }, [isOpen]);

    // Close when clicking anywhere outside the picker.
    useEffect(() => {
        if (!isOpen) {
            return;
        }

        const handlePointerDown = (event: PointerEvent) => {
            if (!containerRef.current?.contains(event.target as Node)) {
                close(false);
            }
        };

        document.addEventListener('pointerdown', handlePointerDown);

        return () =>
            document.removeEventListener('pointerdown', handlePointerDown);
    }, [isOpen]);

    // Keep the highlighted country in view while arrowing through the list.
    useEffect(() => {
        listRef.current
            ?.querySelector(`[data-index="${activeIndex}"]`)
            ?.scrollIntoView({ block: 'nearest' });
    }, [activeIndex, isOpen]);

    const handleSearchKeyDown = (event: React.KeyboardEvent) => {
        if (event.key === 'ArrowDown') {
            event.preventDefault();
            setActiveIndex((i) => Math.min(i + 1, results.length - 1));
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            setActiveIndex((i) => Math.max(i - 1, 0));
        } else if (event.key === 'Enter') {
            event.preventDefault();
            if (results[activeIndex]) {
                choose(results[activeIndex]);
            }
        } else if (event.key === 'Escape') {
            event.preventDefault();
            close();
        } else if (event.key === 'Tab') {
            close(false);
        }
    };

    const activeOptionId = results[activeIndex]
        ? `${listId}-${results[activeIndex].iso}`
        : undefined;

    return (
        <div ref={containerRef} className="flex">
            <button
                ref={triggerRef}
                type="button"
                onClick={() => (isOpen ? close() : open())}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                aria-label={`${label} country code: ${country.name} +${country.code}. Change`}
                className="flex min-h-11 shrink-0 cursor-pointer items-center gap-2 rounded-l-lg border-r border-[#1F2A24]/15 bg-[#1F2A24]/[0.04] pr-2.5 pl-3 text-sm font-medium text-[#1F2A24] tabular-nums transition-colors hover:bg-[#2F6F4E]/10 focus-visible:bg-[#2F6F4E]/10 focus-visible:outline-none"
            >
                <span className="rounded bg-[#2F6F4E]/10 px-1.5 py-0.5 text-[11px] font-semibold tracking-wide text-[#2F6F4E]">
                    {country.iso}
                </span>
                <span>+{country.code}</span>
                <ChevronDown
                    className={`h-4 w-4 text-[#1F2A24]/55 transition-transform duration-150 motion-reduce:transition-none ${
                        isOpen ? 'rotate-180' : ''
                    }`}
                    aria-hidden="true"
                />
            </button>

            {isOpen && (
                <div className="absolute top-full right-0 left-0 z-30 mt-1.5 overflow-hidden rounded-xl border border-[#1F2A24]/10 bg-white shadow-xl shadow-[#1F2A24]/10 sm:right-auto sm:w-80">
                    <div className="relative border-b border-[#1F2A24]/10">
                        <Search
                            className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#1F2A24]/45"
                            aria-hidden="true"
                        />
                        <input
                            ref={searchRef}
                            type="text"
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setActiveIndex(0);
                            }}
                            onKeyDown={handleSearchKeyDown}
                            role="combobox"
                            aria-expanded="true"
                            aria-controls={listId}
                            aria-activedescendant={activeOptionId}
                            aria-autocomplete="list"
                            aria-label="Search country or code"
                            placeholder="Search country or code"
                            autoComplete="off"
                            className="min-h-11 w-full bg-transparent py-2 pr-3 pl-9 text-base text-[#1F2A24] placeholder-[#1F2A24]/45 focus:outline-none sm:text-sm"
                        />
                    </div>

                    <ul
                        ref={listRef}
                        id={listId}
                        role="listbox"
                        aria-label="Countries"
                        className="max-h-64 overflow-y-auto overscroll-contain py-1"
                    >
                        {results.length === 0 && (
                            <li className="px-4 py-6 text-center text-sm text-[#1F2A24]/60">
                                No country matches “{search.trim()}”.
                            </li>
                        )}
                        {results.map((c, index) => {
                            const isSelected = c.iso === country.iso;
                            const isActive = index === activeIndex;
                            const startsOtherCountries =
                                search.trim() === '' &&
                                index === 1 &&
                                results[0]?.iso === DEFAULT_COUNTRY_ISO;

                            return (
                                <Fragment key={c.iso}>
                                    {startsOtherCountries && (
                                        <li
                                            role="presentation"
                                            className="mx-3 my-1 border-t border-[#1F2A24]/10"
                                        />
                                    )}
                                    <li
                                        id={`${listId}-${c.iso}`}
                                        data-index={index}
                                        role="option"
                                        aria-selected={isSelected}
                                        onPointerMove={() =>
                                            setActiveIndex(index)
                                        }
                                        onClick={() => choose(c)}
                                        className={`mx-1 flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-3 text-sm ${
                                            isActive
                                                ? 'bg-[#2F6F4E]/10 text-[#1F2A24]'
                                                : 'text-[#1F2A24]/85'
                                        }`}
                                    >
                                        <span className="w-7 shrink-0 text-[11px] font-semibold tracking-wide text-[#1F2A24]/50">
                                            {c.iso}
                                        </span>
                                        <span className="min-w-0 flex-1 truncate">
                                            {c.name}
                                        </span>
                                        <span className="shrink-0 text-[#1F2A24]/55 tabular-nums">
                                            +{c.code}
                                        </span>
                                        <Check
                                            className={`h-4 w-4 shrink-0 text-[#2F6F4E] ${
                                                isSelected ? '' : 'invisible'
                                            }`}
                                            aria-hidden="true"
                                        />
                                    </li>
                                </Fragment>
                            );
                        })}
                    </ul>
                </div>
            )}
        </div>
    );
}
