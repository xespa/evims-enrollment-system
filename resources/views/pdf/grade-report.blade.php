<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>Grades of {{ $student['name'] }}</title>
    <style>
        @page { margin: 36px 48px 70px; }
        * { box-sizing: border-box; }
        body { font-family: 'DejaVu Serif', serif; font-size: 11px; color: #000000; }
        table { width: 100%; border-collapse: collapse; }
        .letterhead td { vertical-align: middle; }
        .letterhead .logo { width: 110px; text-align: right; padding-right: 8px; }
        .letterhead .text { text-align: center; font-family: 'DejaVu Sans', sans-serif; font-size: 10px; line-height: 1.35; }
        .letterhead .school { font-size: 11.5px; font-weight: bold; }
        .letterhead .spacer { width: 110px; }
        .rule { margin: 6px 20px 14px; border-top: 3px solid #000000; }
        .title { text-align: center; font-size: 18px; font-weight: bold; margin-bottom: 12px; }
        .details td { padding: 4px 0; font-size: 12px; }
        .details .label { width: 105px; font-weight: bold; }
        .details .value { border-bottom: 1px solid #000000; padding-right: 12px; }
        .year { margin-top: 18px; page-break-inside: avoid; }
        .year-heading { font-size: 12px; font-weight: bold; margin-bottom: 6px; }
        .grades th, .grades td { border: 1px solid #000000; padding: 5px 6px; }
        .grades th { font-size: 11px; text-align: center; }
        .grades td { text-align: center; }
        .grades td.subject { text-align: left; }
        .grades td.empty { padding: 16px; font-style: italic; }
        .grades tr.average td { font-weight: bold; }
        .none { margin-top: 18px; padding: 16px; border: 1px solid #000000; text-align: center; font-style: italic; }
        .printed { margin-top: 18px; font-size: 9px; text-align: right; color: #444444; }
        /* The school's branding along the bottom of every page. */
        .footer { position: fixed; left: 0; right: 0; bottom: -52px; }
        .footer .tagline { font-style: italic; font-size: 10px; text-align: center; padding: 3px 0; background: #e8e23a; border-bottom: 5px solid #8cc63f; }
    </style>
</head>
<body>
    <div class="footer">
        <div class="tagline">Sharpen Your Child's Mind. Choose Montessori!</div>
    </div>

    <table class="letterhead">
        <tr>
            <td class="logo">
                @if ($logo)
                    <img src="{{ $logo }}" alt="" style="width: 72px; height: 72px;">
                @endif
            </td>
            <td class="text">
                <div>Republic of the Philippines</div>
                <div>Department of Education</div>
                <div>Region VIII</div>
                <div>Borongan City Division</div>
                <div class="school">EASTERN VISAYAS INTERNATIONAL MONTESSORI SCHOOL, INC.</div>
                <div>Santiago St., Balud I, Borongan City, Eastern Samar, 6800</div>
            </td>
            <td class="spacer"></td>
        </tr>
    </table>
    <div class="rule"></div>

    <div class="title">STUDENT GRADE REPORT</div>

    <table class="details">
        <tr>
            <td class="label">Name:</td>
            <td class="value">{{ $student['name'] }}</td>
            <td class="label" style="padding-left: 14px;">LRN:</td>
            <td class="value">{{ $student['lrn'] ?? '—' }}</td>
        </tr>
    </table>

    @forelse ($schoolYears as $schoolYear)
        <div class="year">
            <div class="year-heading">
                School Year {{ $schoolYear['school_year'] }}@if ($schoolYear['grade_level']) · {{ $schoolYear['grade_level'] }}@endif
            </div>
            <table class="grades">
                <tr>
                    <th>SUBJECT</th>
                    <th style="width: 22%;">TEACHER</th>
                    <th style="width: 9%;">TERM 1</th>
                    <th style="width: 9%;">TERM 2</th>
                    <th style="width: 9%;">TERM 3</th>
                    <th style="width: 9%;">FINAL</th>
                    <th style="width: 10%;">REMARKS</th>
                </tr>
                @forelse ($schoolYear['grades'] as $grade)
                    <tr>
                        <td class="subject">{{ $grade['subject'] }}</td>
                        <td>{{ $grade['teacher'] }}</td>
                        <td>{{ $grade['term_1'] }}</td>
                        <td>{{ $grade['term_2'] }}</td>
                        <td>{{ $grade['term_3'] }}</td>
                        <td>{{ $grade['final_grade'] === null ? '' : number_format($grade['final_grade'], 2) }}</td>
                        <td>{{ $grade['remarks'] }}</td>
                    </tr>
                @empty
                    <tr>
                        <td class="empty" colspan="7">No grades have been entered for this school year yet.</td>
                    </tr>
                @endforelse
                @if ($schoolYear['general_average'] !== null)
                    <tr class="average">
                        <td class="subject" colspan="5">General Average</td>
                        <td>{{ number_format($schoolYear['general_average'], 2) }}</td>
                        <td></td>
                    </tr>
                @endif
            </table>
        </div>
    @empty
        <div class="none">No grades have been entered yet.</div>
    @endforelse

    <div class="printed">Printed {{ $printedAt->format('M. j, Y g:i A') }}</div>
</body>
</html>
