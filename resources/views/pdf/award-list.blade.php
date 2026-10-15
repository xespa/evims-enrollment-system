<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>Academic Awards — SY {{ $schoolYear }}</title>
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
        .title { text-align: center; font-size: 18px; font-weight: bold; }
        .subtitle { text-align: center; font-size: 12px; margin: 2px 0 12px; }
        .basis { font-size: 9.5px; color: #333333; margin-bottom: 10px; }
        .basis li { margin-bottom: 2px; }
        .level { margin-top: 14px; font-size: 13px; font-weight: bold; }
        .awardees { margin-top: 4px; }
        .awardees th, .awardees td { border: 1px solid #000000; padding: 5px 6px; }
        .awardees th { font-size: 10.5px; text-align: center; background: #f1f1f1; }
        .awardees td { vertical-align: top; }
        .awardees td.center { text-align: center; }
        .empty { margin-top: 24px; text-align: center; font-style: italic; }
        .note { margin-top: 18px; font-size: 9.5px; font-style: italic; }
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

    <div class="title">LIST OF ACADEMIC AWARDEES</div>
    <div class="subtitle">School Year {{ $schoolYear }}</div>

    <ul class="basis">
        @foreach ($criteria as $award)
            <li><strong>{{ $award['label'] }}:</strong> {{ $award['criteria'] }}</li>
        @endforeach
        <li>Per DepEd Order No. 015, s. 2026. Awardees are listed alphabetically, not ranked.</li>
    </ul>

    @forelse ($gradeLevels as $gradeLevel)
        <div class="level">{{ strtoupper($gradeLevel['name']) }}</div>
        <table class="awardees">
            <tr>
                <th style="width: 5%;">#</th>
                <th style="width: 34%;">NAME OF LEARNER</th>
                <th style="width: 16%;">LRN</th>
                <th style="width: 11%;">GENERAL AVERAGE</th>
                <th>RECOGNITION</th>
            </tr>
            @foreach ($gradeLevel['students'] as $student)
                <tr>
                    <td class="center">{{ $loop->iteration }}</td>
                    <td>{{ $student['name'] }}</td>
                    <td class="center">{{ $student['lrn'] }}</td>
                    <td class="center">{{ $student['general_average'] ?? '—' }}</td>
                    <td>{{ collect($student['awards'])->pluck('label')->implode('; ') }}</td>
                </tr>
            @endforeach
        </table>
    @empty
        <div class="empty">No learners qualify for an academic award yet.</div>
    @endforelse

    <div class="note">
        Awardees must also have no derogatory records or recorded disciplinary cases within the school year, which advisers confirm before the list is final.
    </div>

    <div class="printed">Printed {{ $printedAt->format('M. j, Y g:i A') }}</div>
</body>
</html>
