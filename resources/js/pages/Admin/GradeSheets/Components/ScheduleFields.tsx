import { SCHEDULE_DAYS, SELECT_CLASS } from './types';
import type { ScheduleData, ScheduleDay } from './types';

type ScheduleErrors = Partial<Record<keyof ScheduleData | string, string>>;

/**
 * When the class meets: the days (toggle buttons) and the start and end
 * time. All optional; printed on the grade sheet.
 */
export default function ScheduleFields({
    data,
    onChange,
    errors,
}: {
    data: ScheduleData;
    onChange: <K extends keyof ScheduleData>(
        field: K,
        value: ScheduleData[K],
    ) => void;
    errors: ScheduleErrors;
}) {
    const toggleDay = (day: ScheduleDay) =>
        onChange(
            'schedule_days',
            data.schedule_days.includes(day)
                ? data.schedule_days.filter((selected) => selected !== day)
                : // Kept in week order, however they were clicked.
                  SCHEDULE_DAYS.map((option) => option.value).filter(
                      (value) =>
                          value === day || data.schedule_days.includes(value),
                  ),
        );

    const daysError =
        errors.schedule_days ??
        Object.entries(errors).find(([key]) =>
            key.startsWith('schedule_days.'),
        )?.[1];

    return (
        <fieldset>
            <legend className="mb-1 block text-sm font-medium text-[#1F2A24]/80">
                Schedule{' '}
                <span className="font-normal text-[#1F2A24]/55">
                    (optional)
                </span>
            </legend>

            <div
                role="group"
                aria-label="Days"
                className="flex flex-wrap gap-1.5"
            >
                {SCHEDULE_DAYS.map((day) => {
                    const isSelected = data.schedule_days.includes(day.value);

                    return (
                        <button
                            key={day.value}
                            type="button"
                            aria-pressed={isSelected}
                            onClick={() => toggleDay(day.value)}
                            className={`min-h-10 min-w-12 rounded-full border px-3 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-[#2F6F4E]/40 focus-visible:outline-none ${
                                isSelected
                                    ? 'border-[#2F6F4E] bg-[#2F6F4E] text-white'
                                    : 'border-[#1F2A24]/15 bg-white text-[#1F2A24]/70 hover:bg-[#2F6F4E]/5'
                            }`}
                        >
                            {day.label}
                        </button>
                    );
                })}
            </div>
            {daysError && (
                <p className="mt-1 text-xs text-[#C6473B]">{daysError}</p>
            )}

            <div className="mt-3 grid grid-cols-2 gap-3">
                <div>
                    <label
                        htmlFor="start-time"
                        className="mb-1 block text-xs font-medium text-[#1F2A24]/70"
                    >
                        Starts
                    </label>
                    <input
                        id="start-time"
                        type="time"
                        value={data.start_time}
                        onChange={(e) => onChange('start_time', e.target.value)}
                        aria-invalid={!!errors.start_time}
                        aria-describedby={
                            errors.start_time ? 'start-time-error' : undefined
                        }
                        className={SELECT_CLASS}
                    />
                    {errors.start_time && (
                        <p
                            id="start-time-error"
                            className="mt-1 text-xs text-[#C6473B]"
                        >
                            {errors.start_time}
                        </p>
                    )}
                </div>
                <div>
                    <label
                        htmlFor="end-time"
                        className="mb-1 block text-xs font-medium text-[#1F2A24]/70"
                    >
                        Ends
                    </label>
                    <input
                        id="end-time"
                        type="time"
                        value={data.end_time}
                        onChange={(e) => onChange('end_time', e.target.value)}
                        aria-invalid={!!errors.end_time}
                        aria-describedby={
                            errors.end_time ? 'end-time-error' : undefined
                        }
                        className={SELECT_CLASS}
                    />
                    {errors.end_time && (
                        <p
                            id="end-time-error"
                            className="mt-1 text-xs text-[#C6473B]"
                        >
                            {errors.end_time}
                        </p>
                    )}
                </div>
            </div>
        </fieldset>
    );
}
