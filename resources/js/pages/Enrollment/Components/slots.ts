/**
 * A grade level on the admission form: `slots` is every section's slots
 * together (null when there's no limit), and `slots_taken` how many
 * applications already hold one.
 */
export type GradeLevelSlots = {
    name: string;
    slots?: number | null;
    slots_taken?: number;
};

/** Every slot is taken, so the grade level can't be applied for. */
export function isGradeLevelFull(grade: GradeLevelSlots): boolean {
    return (
        grade.slots !== null &&
        grade.slots !== undefined &&
        (grade.slots_taken ?? 0) >= grade.slots
    );
}

/** Mirrors Curriculum::fullMessage(). */
export function gradeLevelFullMessage(
    grade: GradeLevelSlots,
    schoolYear: string,
): string {
    return `${grade.name} is full for S.Y. ${schoolYear}: all ${grade.slots} slots are taken. Please contact the school to ask about a waitlist.`;
}
