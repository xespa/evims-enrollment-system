import type {
    GradeSheetSummary,
    StudentGradeRow,
} from '../GradeSheets/Components/types';
import StudentGradeForm from './Components/StudentGradeForm';

export default function Edit({
    gradeSheet,
    studentGrade,
}: {
    gradeSheet: GradeSheetSummary;
    studentGrade: StudentGradeRow;
}) {
    return (
        <StudentGradeForm
            mode="edit"
            gradeSheet={gradeSheet}
            studentGrade={studentGrade}
        />
    );
}
