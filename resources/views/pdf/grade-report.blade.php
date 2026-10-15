<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>Learner's Performance Report of {{ $student['name'] }}</title>
    <style>
        @page { margin: 32px 44px 36px; }
        * { box-sizing: border-box; }
        body { font-family: 'DejaVu Serif', serif; font-size: 11px; color: #000000; }
        table { width: 100%; border-collapse: collapse; }
        .grades { table-layout: fixed; }
        .letterhead td { vertical-align: middle; }
        .letterhead .side { width: 90px; }
        .letterhead .logo { text-align: center; }
        .letterhead .text { text-align: center; font-size: 11.5px; line-height: 1.3; }
        .letterhead .office { font-weight: bold; }
        .school { margin: 10px 0 0 70px; font-size: 11.5px; }
        .school .line { display: inline-block; min-width: 330px; border-bottom: 1px solid #000000; text-align: center; }
        .title { margin-top: 16px; text-align: center; font-size: 14px; font-weight: bold; }
        .year { text-align: center; font-size: 12px; }
        .learner { margin-top: 14px; font-size: 11.5px; }
        .learner td { padding: 3px 4px 3px 0; vertical-align: bottom; }
        .learner .label { white-space: nowrap; }
        .learner .value { border-bottom: 1px solid #000000; padding-left: 4px; }
        .letter { margin-top: 16px; font-size: 11.5px; line-height: 1.35; text-align: justify; }
        .letter p { margin: 0; }
        .letter .indent { text-indent: 48px; }
        .section-title { margin-top: 16px; margin-bottom: 6px; text-align: center; font-size: 12px; font-weight: bold; }
        .grades th, .grades td { border: 1px solid #000000; padding: 4px 6px; }
        .grades th { font-size: 11.5px; text-align: center; }
        .grades th.term { font-weight: normal; }
        .grades td { text-align: center; }
        .grades td.subject { text-align: left; }
        .grades td.empty { padding: 14px; font-style: italic; }
        .grades .average td { font-weight: bold; }
        .grades .average td.label { border-left: 1px solid #000000; text-align: right; }
        .descriptors { width: 82%; margin: 0 auto; font-size: 11.5px; }
        .descriptors th, .descriptors td { text-align: center; padding: 1px 4px; }
        .page-break { page-break-after: always; }
    </style>
</head>
<body>
    @php
        // A report with no school year yet still prints the learner's details.
        $reports = $schoolYears ?: [['school_year' => null, 'grade_level' => null, 'section' => null, 'age' => '', 'grades' => [], 'term_averages' => ['term_1' => null, 'term_2' => null, 'term_3' => null], 'general_average' => null, 'general_remarks' => null]];
    @endphp

    @foreach ($reports as $report)
        <table class="letterhead">
            <tr>
                <td class="side"></td>
                <td class="text">
                    <div>Republic of the Philippines</div>
                    <div>Department of Education</div>
                    <div>Region VIII</div>
                    <div class="office">SCHOOLS DIVISION OFFICE OF BORONGAN CITY</div>
                    <div>Borongan City, Eastern Samar</div>
                </td>
                <td class="side logo">
                    @if ($logo)
                        <img src="{{ $logo }}" alt="" style="width: 72px; height: 72px;">
                    @endif
                </td>
            </tr>
        </table>

        <div class="school">
            School: <span class="line">EASTERN VISAYAS INTERNATIONAL MONTESSORI SCHOOL, INC.</span>
        </div>

        <div class="title">LEARNER’S PERFORMANCE REPORT</div>
        <div class="year">School Year {{ $report['school_year'] ?? '____________' }}</div>

        <table class="learner">
            <tr>
                <td class="label" style="width: 52px;">Name:</td>
                <td class="value">{{ $student['name'] }}</td>
                <td class="label" style="width: 58px; padding-left: 12px;">Age:</td>
                <td class="value" style="width: 56px;">{{ $report['age'] }}</td>
                <td class="label" style="width: 72px; padding-left: 12px;">Sex:</td>
                <td class="value" style="width: 110px;">{{ $student['sex'] }}</td>
            </tr>
            <tr>
                <td class="label">LRN:</td>
                <td class="value">{{ $student['lrn'] }}</td>
                <td class="label" style="padding-left: 12px;">Grade:</td>
                <td class="value">{{ $report['grade_level'] }}</td>
                <td class="label" style="padding-left: 12px;">Section:</td>
                <td class="value">{{ $report['section'] }}</td>
            </tr>
            <tr>
                <td class="label" colspan="2">
                    Track (SHS only) <span style="display: inline-block; width: 220px; border-bottom: 1px solid #000000;">&nbsp;</span>
                </td>
                <td colspan="4"></td>
            </tr>
        </table>

        <div class="letter">
            <p>Dear Parents,</p>
            <p class="indent">This Performance Report shows the ability and progress your child has made in the different learning areas as well as his/her core values.</p>
            <p class="indent">The school welcomes you should you desire to know more about your child’s progress.</p>
        </div>

        <div class="section-title">LEARNING PROGRESS AND ACHIEVEMENT</div>

        <table class="grades">
            <tr>
                <th rowspan="2" style="width: 49%;">Learning Areas</th>
                <th colspan="3" style="width: 24%;">TERM</th>
                <th rowspan="2" style="width: 13%;">Final<br>Grade</th>
                <th rowspan="2" style="width: 15%;">Remarks</th>
            </tr>
            <tr>
                <th class="term" style="width: 8%;">1</th>
                <th class="term" style="width: 8%;">2</th>
                <th class="term" style="width: 8%;">3</th>
            </tr>
            @forelse ($report['grades'] as $grade)
                <tr>
                    <td class="subject">{{ $grade['subject'] }}</td>
                    <td>{{ $grade['term_1'] }}</td>
                    <td>{{ $grade['term_2'] }}</td>
                    <td>{{ $grade['term_3'] }}</td>
                    <td>{{ $grade['final_grade'] === null ? '' : number_format($grade['final_grade'], 2) }}</td>
                    <td>{{ $grade['remarks'] }}</td>
                </tr>
            @empty
                <tr>
                    <td class="empty" colspan="6">No grades have been entered for this school year yet.</td>
                </tr>
            @endforelse
            <tr class="average">
                <td class="label">General Average</td>
                @foreach (['term_1', 'term_2', 'term_3'] as $term)
                    <td>{{ $report['term_averages'][$term] === null ? '' : number_format($report['term_averages'][$term], 2) }}</td>
                @endforeach
                <td>{{ $report['general_average'] === null ? '' : number_format($report['general_average'], 2) }}</td>
                <td>{{ $report['general_remarks'] }}</td>
            </tr>
        </table>

        <div class="section-title">PERFORMANCE DESCRIPTORS</div>

        <table class="descriptors">
            <tr>
                <th>Grading Scale</th>
                <th>Description</th>
                <th>Remarks</th>
            </tr>
            @foreach ([['90-100', 'Advancing', 'Passed'], ['80-89', 'Benchmarking', 'Passed'], ['75-79', 'Connecting', 'Passed'], ['65-74', 'Developing', 'Failed'], ['0-64', 'Emerging', 'Failed']] as [$scale, $description, $remarks])
                <tr>
                    <td>{{ $scale }}</td>
                    <td>{{ $description }}</td>
                    <td>{{ $remarks }}</td>
                </tr>
            @endforeach
        </table>

        @if (! $loop->last)
            <div class="page-break"></div>
        @endif
    @endforeach
</body>
</html>
