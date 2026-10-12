<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>Enrollment Summary — SY {{ $schoolYear }}</title>
    <style>
        @page { margin: 36px 48px 70px; }
        * { box-sizing: border-box; }
        body { font-family: 'DejaVu Serif', serif; font-size: 12px; color: #000000; }
        table { width: 100%; border-collapse: collapse; }
        .letterhead td { vertical-align: middle; }
        .letterhead .logo { width: 110px; text-align: right; padding-right: 8px; }
        .letterhead .text { text-align: center; font-family: 'DejaVu Sans', sans-serif; font-size: 10px; line-height: 1.35; }
        .letterhead .school { font-size: 11.5px; font-weight: bold; }
        .letterhead .spacer { width: 110px; }
        .rule { margin: 6px 20px 18px; border-top: 3px solid #000000; }
        .title { text-align: center; font-size: 20px; font-weight: bold; }
        .title small { font-size: 11px; }
        .school-year { text-align: center; font-size: 20px; font-weight: bold; margin: 4px 0 14px; }
        .summary th, .summary td { border: 1px solid #000000; padding: 6px 10px; }
        .summary th { font-size: 13px; text-align: center; }
        .summary th.level-col { width: 28%; }
        .summary td { text-align: center; font-size: 13px; }
        .summary td.level { text-align: left; }
        .summary td.department { font-weight: bold; font-size: 14px; text-align: center; padding: 10px; }
        .summary .total td { font-weight: bold; font-size: 14px; padding: 10px; }
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
                <div>Cel No. 0936-084-2412</div>
                <div>Email address: evimstech2020@gmail.com</div>
            </td>
            <td class="spacer"></td>
        </tr>
    </table>
    <div class="rule"></div>

    <div class="title">ENROLLMENT SUMMARY <small>(as of {{ $asOf->format('M. j, Y') }})</small></div>
    <div class="school-year">SY: {{ $schoolYear }}</div>

    <table class="summary">
        @foreach ($departments as $department)
            @if ($loop->first)
                <tr>
                    <th class="level-col">{{ $department['name'] }}</th>
                    <th>MALE</th>
                    <th>FEMALE</th>
                    <th>NUMBER OF PUPILS</th>
                </tr>
            @else
                <tr>
                    <td class="department">{{ $department['name'] }}</td>
                    <td></td>
                    <td></td>
                    <td></td>
                </tr>
            @endif

            @foreach ($department['levels'] as $level)
                <tr>
                    <td class="level">{{ $level['label'] }}</td>
                    <td>{{ $level['male'] }}</td>
                    <td>{{ $level['female'] }}</td>
                    <td>{{ $level['total'] }}</td>
                </tr>
            @endforeach
        @endforeach
        <tr class="total">
            <td>TOTAL NUMBER OF PUPILS</td>
            <td>{{ $totals['male'] }}</td>
            <td>{{ $totals['female'] }}</td>
            <td>{{ $totals['total'] }}</td>
        </tr>
    </table>
</body>
</html>
