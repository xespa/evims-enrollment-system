<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>Grade Sheet {{ $gradeSheet['number'] }}</title>
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
        .grades { margin-top: 14px; }
        .grades th, .grades td { border: 1px solid #000000; padding: 5px 6px; }
        .grades th { font-size: 11px; text-align: center; }
        .grades td { text-align: center; }
        .grades td.name { text-align: left; }
        .grades td.empty { padding: 16px; font-style: italic; }
        .signature { margin-top: 48px; width: 260px; margin-left: auto; text-align: center; }
        .signature .line { border-top: 1px solid #000000; padding-top: 3px; font-weight: bold; }
        .printed { margin-top: 6px; font-size: 9px; text-align: right; color: #444444; }
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

    <div class="title">GRADE SHEET</div>

    <table class="details">
        <tr>
            <td class="label">Teacher:</td>
            <td class="value">{{ $gradeSheet['teacher'] }}</td>
            <td class="label" style="padding-left: 14px;">Grade Sheet No.:</td>
            <td class="value">{{ $gradeSheet['number'] }}</td>
        </tr>
        <tr>
            <td class="label">Subject:</td>
            <td class="value">{{ $gradeSheet['subject'] }}</td>
            <td class="label" style="padding-left: 14px;">Subject Code:</td>
            <td class="value">{{ $gradeSheet['subject_code'] ?? '—' }}</td>
        </tr>
        <tr>
            <td class="label">Grade Level:</td>
            <td class="value">{{ $gradeSheet['grade_level'] }}</td>
            <td class="label" style="padding-left: 14px;">School Year:</td>
            <td class="value">{{ $gradeSheet['school_year'] }}</td>
        </tr>
        <tr>
            <td class="label">Schedule:</td>
            <td class="value" colspan="3">{{ $gradeSheet['schedule'] ?? '—' }}</td>
        </tr>
    </table>

    <table class="grades">
        <tr>
            <th style="width: 5%;">#</th>
            <th>NAME OF STUDENT</th>
            <th style="width: 18%;">LRN</th>
            <th style="width: 9%;">TERM 1</th>
            <th style="width: 9%;">TERM 2</th>
            <th style="width: 9%;">TERM 3</th>
            <th style="width: 9%;">FINAL</th>
            <th style="width: 10%;">REMARKS</th>
        </tr>
        @forelse ($rows as $row)
            <tr>
                <td>{{ $loop->iteration }}</td>
                <td class="name">{{ $row['student_name'] }}</td>
                <td>{{ $row['lrn'] }}</td>
                <td>{{ $row['term_1'] }}</td>
                <td>{{ $row['term_2'] }}</td>
                <td>{{ $row['term_3'] }}</td>
                <td>{{ $row['final_grade'] === null ? '' : number_format($row['final_grade'], 2) }}</td>
                <td>{{ $row['remarks'] }}</td>
            </tr>
        @empty
            <tr>
                <td class="empty" colspan="8">No students on this grade sheet yet.</td>
            </tr>
        @endforelse
    </table>

    <div class="signature">
        <div style="margin-bottom: 2px;">{{ strtoupper($gradeSheet['teacher']) }}</div>
        <div class="line">Subject Teacher</div>
    </div>

    <div class="printed">Printed {{ $printedAt->format('M. j, Y g:i A') }}</div>
</body>
</html>
