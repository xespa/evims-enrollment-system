<?php

namespace Database\Seeders;

use App\Models\Enrollment;
use App\Models\GradeLevel;
use Illuminate\Database\Seeder;

class SubjectSeeder extends Seeder
{
    public function run(): void
    {
        $kinderSubjects = ['Language', 'Reading Readiness', 'Numeracy', 'Good Manners and Right Conduct', 'Motor Skills Development'];

        $gradeSchoolSubjects = [ // Grades 1-3
            'Filipino', 'English', 'Mathematics', 'Araling Panlipunan',
            'Mother Tongue', 'Edukasyon sa Pagpapakatao', 'MAPEH',
        ];

        $upperElementarySubjects = [ // Grades 4-6
            'Filipino', 'English', 'Mathematics', 'Science', 'Araling Panlipunan',
            'Edukasyon sa Pagpapakatao', 'MAPEH', 'Edukasyong Pantahanan at Pangkabuhayan',
        ];

        $juniorHighSubjects = [ // Grades 7-10
            'Filipino', 'English', 'Mathematics', 'Science', 'Araling Panlipunan',
            'Edukasyon sa Pagpapakatao', 'MAPEH', 'Technology and Livelihood Education',
        ];

        $map = [
            'Nursery' => $kinderSubjects,
            'Pre-K 1' => $kinderSubjects,
            'Pre-K 2' => $kinderSubjects,
            'Grade 1' => $gradeSchoolSubjects,
            'Grade 2' => $gradeSchoolSubjects,
            'Grade 3' => $gradeSchoolSubjects,
            'Grade 4' => $upperElementarySubjects,
            'Grade 5' => $upperElementarySubjects,
            'Grade 6' => $upperElementarySubjects,
            'Grade 7' => $juniorHighSubjects,
            'Grade 8' => $juniorHighSubjects,
            'Grade 9' => $juniorHighSubjects,
            'Grade 10' => $juniorHighSubjects,
        ];

        $schoolYear = Enrollment::currentSchoolYear();

        foreach ($map as $gradeName => $subjects) {
            $curriculum = GradeLevel::where('name', $gradeName)->firstOrFail()->curriculumFor($schoolYear);

            foreach ($subjects as $subjectName) {
                $curriculum->subjects()->create(['name' => $subjectName]);
            }
        }
    }
}
