import { Check, ChevronsUpDown, Search } from 'lucide-react';
import { useId, useState } from 'react';
import type { KeyboardEvent } from 'react';

export type StudentOption = {
    enrollment_id: number;
    name: string;
    lrn: string | null;
};

type Props = {
    id: string;
    students: StudentOption[];
    value: number | null;
    onChange: (enrollmentId: number | null) => void;
    invalid?: boolean;
    describedBy?: string;
};

/**
 * Pick a student by typing part of their name or LRN. Follows the ARIA
 * combobox pattern: arrow keys move through the matches, Enter picks one,
 * Escape closes the list.
 */
export default function StudentCombobox({
    id,
    students,
    value,
    onChange,
    invalid = false,
    describedBy,
}: Props) {
    const listboxId = useId();
    const selected =
        students.find((student) => student.enrollment_id === value) ?? null;

    const [query, setQuery] = useState(selected?.name ?? '');
    const [isOpen, setIsOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);

    // While the box still shows the picked name, list everyone.
    const isShowingSelection = selected !== null && query === selected.name;
    const needle = query.trim().toLowerCase();
    const matches =
        isShowingSelection || needle === ''
            ? students
            : students.filter(
                  (student) =>
                      student.name.toLowerCase().includes(needle) ||
                      (student.lrn ?? '').includes(needle),
              );

    const pick = (student: StudentOption) => {
        onChange(student.enrollment_id);
        setQuery(student.name);
        setIsOpen(false);
    };

    const open = () => {
        const selectedIndex = matches.findIndex(
            (student) => student.enrollment_id === value,
        );
        setActiveIndex(Math.max(selectedIndex, 0));
        setIsOpen(true);
    };

    const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        switch (event.key) {
            case 'ArrowDown':
                event.preventDefault();

                if (!isOpen) {
                    open();
                } else {
                    setActiveIndex((index) =>
                        Math.min(index + 1, matches.length - 1),
                    );
                }

                break;
            case 'ArrowUp':
                event.preventDefault();
                setActiveIndex((index) => Math.max(index - 1, 0));
                break;
            case 'Enter':
                if (isOpen && matches[activeIndex]) {
                    event.preventDefault();
                    pick(matches[activeIndex]);
                }

                break;
            case 'Escape':
                if (isOpen) {
                    event.preventDefault();
                    setIsOpen(false);
                }

                break;
        }
    };

    const optionId = (index: number) => `${listboxId}-option-${index}`;

    return (
        <div className="relative">
            <Search
                className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-ink/40"
                aria-hidden="true"
            />
            <input
                id={id}
                type="text"
                role="combobox"
                autoComplete="off"
                placeholder="Search by name or LRN"
                value={query}
                onChange={(e) => {
                    setQuery(e.target.value);
                    setActiveIndex(0);
                    setIsOpen(true);

                    if (value !== null) {
                        onChange(null);
                    }
                }}
                onFocus={open}
                onClick={open}
                onBlur={() => setIsOpen(false)}
                onKeyDown={onKeyDown}
                aria-expanded={isOpen}
                aria-controls={listboxId}
                aria-autocomplete="list"
                aria-activedescendant={
                    isOpen && matches[activeIndex]
                        ? optionId(activeIndex)
                        : undefined
                }
                aria-invalid={invalid}
                aria-describedby={describedBy}
                className="min-h-11 w-full rounded-lg border border-ink/15 bg-surface py-2 pr-10 pl-9 text-base text-ink placeholder-ink/40 focus:border-brand focus:ring-2 focus:ring-brand/30 focus:outline-none aria-[invalid=true]:border-danger sm:text-sm"
            />
            <ChevronsUpDown
                className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-ink/40"
                aria-hidden="true"
            />

            {isOpen && (
                <ul
                    id={listboxId}
                    role="listbox"
                    aria-label="Students"
                    className="absolute z-20 mt-1 max-h-72 w-full overflow-y-auto rounded-xl border border-ink/10 bg-surface p-1 shadow-lg"
                >
                    {matches.length === 0 ? (
                        <li className="px-3 py-2.5 text-sm text-ink/60">
                            No student matches "{query}".
                        </li>
                    ) : (
                        matches.map((student, index) => {
                            const isSelected = student.enrollment_id === value;

                            return (
                                <li
                                    key={student.enrollment_id}
                                    id={optionId(index)}
                                    role="option"
                                    aria-selected={isSelected}
                                    // Keeps focus in the input so the blur
                                    // doesn't close the list before the click.
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => pick(student)}
                                    onMouseEnter={() => setActiveIndex(index)}
                                    className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                                        index === activeIndex
                                            ? 'bg-brand/10 text-ink'
                                            : 'text-ink/85'
                                    }`}
                                >
                                    <Check
                                        className={`h-4 w-4 shrink-0 text-brand-ink ${isSelected ? '' : 'invisible'}`}
                                        aria-hidden="true"
                                    />
                                    <span className="min-w-0 flex-1">
                                        <span className="block truncate font-medium">
                                            {student.name}
                                        </span>
                                        <span className="block text-xs text-ink/55">
                                            {student.lrn
                                                ? `LRN ${student.lrn}`
                                                : 'No LRN yet'}
                                        </span>
                                    </span>
                                </li>
                            );
                        })
                    )}
                </ul>
            )}
        </div>
    );
}
