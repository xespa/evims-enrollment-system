import type { GradeSheetSummary } from '../GradeSheets/Components/types';
import StudentGradeForm from './Components/StudentGradeForm';
import type { StudentOption } from './Components/StudentCombobox';

export default function Create({
    gradeSheet,
    students,
}: {
    gradeSheet: GradeSheetSummary;
    students: StudentOption[];
}) {
    return (
        <StudentGradeForm
            mode="create"
            gradeSheet={gradeSheet}
            students={students}
        />
    );
}
