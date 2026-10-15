<?php

namespace App\Enums;

/**
 * The grade-based recognitions in DepEd Order No. 015, s. 2026 (the revised
 * awards guidelines, from SY 2026-2027), which replaced the With Honors /
 * With High Honors / With Highest Honors tiers of DO 36, s. 2016.
 */
enum AcademicAward: string
{
    case AcademicExcellence = 'ACADEMIC_EXCELLENCE';
    case LearningAreaExcellence = 'LEARNING_AREA_EXCELLENCE';

    public function label(): string
    {
        return match ($this) {
            self::AcademicExcellence => 'Academic Excellence Award',
            self::LearningAreaExcellence => 'Excellence in a Learning Area',
        };
    }

    /**
     * Who qualifies, in a sentence for staff.
     */
    public function criteria(): string
    {
        return match ($this) {
            self::AcademicExcellence => 'A general average of 90 or higher, with no final grade below 80 in any learning area.',
            self::LearningAreaExcellence => 'The highest final grade in a learning area, as long as it is 90 or higher.',
        };
    }
}
