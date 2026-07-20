<?php

namespace Database\Seeders;

use App\Models\GradeLevel;
use App\Models\Subject;
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
            'Kinder' => $kinderSubjects,
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

        foreach ($map as $gradeName => $subjects) {
            $grade = GradeLevel::where('name', $gradeName)->first();
            foreach ($subjects as $subjectName) {
                Subject::create([
                    'grade_level_id' => $grade->id,
                    'name' => $subjectName,
                ]);
            }
        }
    }
}
