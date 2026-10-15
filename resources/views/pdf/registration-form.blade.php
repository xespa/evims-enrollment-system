@php
    $peso = fn ($amount) => '₱'.number_format((float) $amount, 2);
    $months = \App\Models\Curriculum::BILLABLE_MONTHS;
    // The paper form asks for every answer in capital letters.
    $upper = fn (?string $value) => filled($value) ? mb_strtoupper(trim($value)) : '';
    $tick = fn (bool $checked) => $checked ? '✓' : '';
    [$startYear, $endYear] = explode('-', $enrollment->school_year);
    $lrnDigits = str_split((string) $student->lrn);
    $lrnBoxes = max(14, count($lrnDigits));
    $birthDate = $student->date_of_birth;
    $vitals = [
        ['has_attended_summer_school', 'Attended summer school program'],
        ['has_emotional_mental_physical_difficulties', 'Had an emotional, mental, or physical difficulties'],
        ['has_learning_difficulties', 'Had a learning difficulties'],
        ['has_extended_absences', 'Had extended absences from school'],
        ['shows_special_abilities_interests', 'Show special abilities/ interest'],
    ];
    $disciplinaryVitals = [
        ['has_been_expelled', 'Been Expelled'],
        ['has_been_suspended', 'Been suspended'],
        ['has_repeated_a_grade', 'Repeated a grade'],
    ];
    $sessions = [
        'MORNING_SESSION' => 'MORNING SESSION',
        'AFTERNOON_SESSION' => 'AFTERNOON SESSION',
        'SCHOOL_SERVICE' => 'SCHOOL SERVICE',
    ];
    $paymentOptions = [
        'MONTHLY' => 'Monthly',
        'BI_MONTHLY' => 'Bi-monthly',
        'FULL_PAYMENT' => 'Full payment',
    ];
@endphp
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>Enrollment Form — {{ $student->first_name }} {{ $student->last_name }}</title>
    <style>
        @page { margin: 24px 40px 58px; }
        * { box-sizing: border-box; }
        body { font-family: 'DejaVu Serif', serif; font-size: 10px; color: #1a1a1a; line-height: 1.25; }
        table { border-collapse: collapse; }
        .full { width: 100%; }
        .page-break { page-break-before: always; }

        .header td { vertical-align: top; }
        .school { font-size: 11.5px; font-weight: bold; text-align: center; }
        .center { text-align: center; }
        .form-title { font-size: 11.5px; font-weight: bold; margin-top: 6px; }
        .italic { font-style: italic; }
        .photo { width: 96px; height: 96px; border: 2px solid #1a1a1a; }

        .box { display: inline-block; width: 13px; height: 13px; border: 1px solid #1a1a1a; text-align: center; line-height: 12px; font-family: 'DejaVu Sans', sans-serif; font-size: 10px; vertical-align: middle; }
        .digits td { border: 1px solid #1a1a1a; width: 16px; height: 16px; text-align: center; font-family: 'DejaVu Sans', sans-serif; font-weight: bold; font-size: 10px; }
        .digits td.gap { border: none; width: 8px; }

        .bar { background: #b4b8bd; border-bottom: 2px solid #8a8f95; text-align: center; font-weight: bold; font-size: 11px; padding: 2px 0; margin: 7px 0 4px; }

        .fields td { padding: 3px 0 0; vertical-align: bottom; white-space: nowrap; }
        .fields td.label { padding-right: 6px; }
        .value { border-bottom: 1px solid #1a1a1a; font-family: 'DejaVu Sans', sans-serif; font-weight: bold; font-size: 10px; white-space: normal !important; padding-left: 4px !important; }
        .caption { font-size: 9.5px; padding-top: 1px !important; vertical-align: top !important; }

        .check-line { display: inline-block; width: 26px; border-bottom: 1px solid #1a1a1a; text-align: center; font-family: 'DejaVu Sans', sans-serif; font-size: 10px; line-height: 11px; }
        .vitals td { padding: 1px 0; vertical-align: top; }

        .signature td { vertical-align: bottom; }
        .signature .line { border-top: 1px solid #1a1a1a; text-align: center; padding-top: 2px; }

        .payment-option { border: 1px solid #1a1a1a; padding: 6px 8px; width: 150px; }
        .justify { text-align: justify; }

        .grid { width: 100%; }
        .grid th, .grid td { padding: 3px 6px; border: 1px solid #9aa0a6; text-align: left; font-family: 'DejaVu Sans', sans-serif; font-size: 9.5px; }
        .grid th { background: #e3e5e8; }
        .amount { text-align: right !important; white-space: nowrap; }
        .total td { font-weight: bold; background: #e3e5e8; }

        /* Along the bottom of every page, like the printed form's footer. */
        .footer { position: fixed; left: 0; right: 0; bottom: -44px; }
        .footer td { vertical-align: bottom; }
        .footer .page { font-size: 8.5px; }
        .footer .page .number:before { content: counter(page); }
        .footer .tagline { background: #4a4f55; color: #ffffff; font-style: italic; font-size: 9px; padding: 3px 10px; text-align: right; }
        .footer .tagline strong { font-style: normal; font-family: 'DejaVu Sans', sans-serif; font-size: 13px; margin-left: 6px; }
    </style>
</head>
<body>
    <div class="footer">
        <table class="full">
            <tr>
                <td class="page"><span class="number"></span> | Enrollment Form (EVIMS)</td>
                <td style="width: 55%;"><div class="tagline">Sharpen Your Child's Mind. Choose Montessori! <strong>EVIMS</strong></div></td>
            </tr>
        </table>
    </div>

    {{-- Page 1: the enrollment form --}}
    <table class="full header">
        <tr>
            <td style="width: 100px;">
                @if ($logo)
                    <img src="{{ $logo }}" alt="" style="width: 80px; height: 80px;">
                @endif
            </td>
            <td class="center">
                <div class="school">EASTERN VISAYAS INTERNATIONAL MONTESSORI SCHOOL, INC.</div>
                <div>SANTIAGO ST., BRGY. BALUD 1, BORONGAN CITY</div>
                <div class="form-title">BASIC EDUCATION ENROLLMENT FORM</div>
                <div>THIS FORM IS NOT FOR SALE</div>
                <div class="italic" style="margin-top: 6px;">Check the appropriate box only</div>
            </td>
            <td style="width: 120px;" class="center"><div class="photo"></div></td>
        </tr>
    </table>

    <table class="full" style="margin-top: 6px;">
        <tr>
            <td style="width: 48%;">
                <table>
                    <tr>
                        <td style="padding-right: 6px;">School Year</td>
                        <td>
                            <table class="digits">
                                <tr>
                                    @foreach (str_split($startYear) as $digit)<td>{{ $digit }}</td>@endforeach
                                    <td class="gap">-</td>
                                    @foreach (str_split($endYear) as $digit)<td>{{ $digit }}</td>@endforeach
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </td>
            <td>
                <span class="box">{{ $tick($enrollment->student_type === 'NO_LRN') }}</span> No LRN &nbsp;&nbsp;
                <span class="box">{{ $tick($enrollment->student_type === 'WITH_LRN') }}</span> with LRN &nbsp;&nbsp;
                <span class="box">{{ $tick($enrollment->student_type === 'RETURNEE') }}</span> Returnee
            </td>
        </tr>
    </table>

    <p class="center" style="margin: 8px 0 0; font-size: 9.5px;">
        <strong>INSTRUCTIONS:</strong> <span class="italic">Print legibly all information required in CAPITAL letters. Submit accomplished form to the Person-in-Charge/Registrar/Class Adviser. Use black or blue pen only.</span>
    </p>

    <div class="bar">STUDENT'S INFORMATION</div>

    <table class="full fields">
        <tr>
            <td class="label" style="width: 32%;">PSA Birth Certificate No.</td>
            <td class="value" style="width: 40%;">{{ $upper($student->psa_birth_cert_no) }}</td>
            <td></td>
        </tr>
    </table>
    <table class="fields">
        <tr>
            <td class="label" style="width: 175px;">Learner Reference No. (LRN)</td>
            <td>
                <table class="digits">
                    <tr>
                        @for ($i = 0; $i < $lrnBoxes; $i++)<td>{{ $lrnDigits[$i] ?? '' }}</td>@endfor
                    </tr>
                </table>
            </td>
        </tr>
    </table>
    <table class="full fields">
        <tr><td class="label" style="width: 32%;">LAST NAME</td><td class="value">{{ $upper($student->last_name) }}</td><td style="width: 20%;"></td></tr>
        <tr><td class="label">FIRST NAME</td><td class="value">{{ $upper($student->first_name) }}</td><td></td></tr>
        <tr><td class="label">MIDDLE NAME</td><td class="value">{{ $upper($student->middle_name) }}</td><td></td></tr>
        <tr><td class="label">EXTENSION NAME e.g. Jr., III (if applicable)</td><td class="value">{{ $upper($student->extension_name) }}</td><td></td></tr>
    </table>
    <table class="full fields" style="margin-top: 4px;">
        <tr>
            <td class="label" style="width: 90px;">DATE OF BIRTH<br><span class="italic" style="font-size: 9px;">(Month/Day/Year)</span></td>
            <td>
                <table class="digits">
                    <tr>
                        @foreach (str_split($birthDate?->format('m') ?? '  ') as $digit)<td>{{ trim($digit) }}</td>@endforeach
                        <td class="gap"></td>
                        @foreach (str_split($birthDate?->format('d') ?? '  ') as $digit)<td>{{ trim($digit) }}</td>@endforeach
                        <td class="gap"></td>
                        @foreach (str_split($birthDate?->format('Y') ?? '    ') as $digit)<td>{{ trim($digit) }}</td>@endforeach
                    </tr>
                </table>
            </td>
            <td style="text-align: right;">
                SEX: &nbsp;&nbsp; MALE <span class="box">{{ $tick($student->sex === 'MALE') }}</span>
                &nbsp;&nbsp; FEMALE <span class="box">{{ $tick($student->sex === 'FEMALE') }}</span>
                &nbsp;&nbsp; AGE: <span class="box" style="width: 44px; height: 20px; line-height: 19px; font-weight: bold;">{{ $enrollment->age }}</span>
            </td>
        </tr>
    </table>

    <div class="bar">ADDRESS</div>

    <table class="full fields">
        <tr>
            <td class="value" style="width: 58%;">{{ $upper($address?->house_number_street) }}</td>
            <td style="width: 4%;"></td>
            <td class="value">{{ $upper($address?->city_municipality) }}</td>
        </tr>
        <tr><td class="caption">House Number and Street</td><td></td><td class="caption">City/Municipality</td></tr>
        <tr>
            <td class="value">{{ $upper($address?->barangay) }}</td>
            <td></td>
            <td class="value">{{ $upper($address?->province) }}</td>
        </tr>
        <tr><td class="caption">Barangay</td><td></td><td class="caption">Province</td></tr>
    </table>
    <table class="full fields">
        <tr>
            <td class="value" style="width: 58%;">{{ $upper($address?->country) }}</td>
            <td style="width: 4%;"></td>
            <td style="text-align: right; padding-right: 6px;">Zip Code</td>
            <td style="width: 76px;">
                <table class="digits">
                    <tr>
                        @for ($i = 0; $i < 4; $i++)<td>{{ str_split((string) $address?->zip_code)[$i] ?? '' }}</td>@endfor
                    </tr>
                </table>
            </td>
        </tr>
        <tr><td class="caption">Country</td><td colspan="3"></td></tr>
    </table>

    @if ($parents?->isGuardian())
    <div class="bar">GUARDIAN'S INFORMATION</div>

    <table class="full fields">
        <tr><td colspan="6"><strong>Guardian's Name <span class="italic">(Last Name, First Name, Middle Name)</span></strong></td></tr>
        <tr><td colspan="6" class="value">{{ $upper(collect([$parents->guardian_last_name, trim("{$parents->guardian_first_name} {$parents->guardian_middle_name}")])->filter()->implode(', ')) }}</td></tr>
        <tr>
            <td class="label">Relationship:</td><td colspan="5" class="value">{{ $upper($parents->guardian_relationship) }}</td>
        </tr>
        <tr>
            <td class="label">Occupation:</td><td class="value" style="width: 24%;">{{ $upper($parents->guardian_occupation) }}</td>
            <td class="label" style="padding-left: 8px;">Name of Office:</td><td class="value" style="width: 24%;">{{ $upper($parents->guardian_name_of_office) }}</td>
            <td class="label" style="padding-left: 8px;">Mobile No.</td><td class="value">{{ $parents->guardian_mobile_no }}</td>
        </tr>
    </table>
    @else
    <div class="bar">PARENT'S INFORMATION</div>

    <table class="full fields">
        <tr><td colspan="6"><strong>Father's Name <span class="italic">(Last Name, First Name, Middle Name)</span></strong></td></tr>
        <tr><td colspan="6" class="value">{{ $upper(collect([$parents?->father_last_name, trim("{$parents?->father_first_name} {$parents?->father_middle_name}")])->filter()->implode(', ')) }}</td></tr>
        <tr>
            <td class="label">Occupation:</td><td class="value" style="width: 24%;">{{ $upper($parents?->father_occupation) }}</td>
            <td class="label" style="padding-left: 8px;">Name of Office:</td><td class="value" style="width: 24%;">{{ $upper($parents?->father_name_of_office) }}</td>
            <td class="label" style="padding-left: 8px;">Mobile No.</td><td class="value">{{ $parents?->father_mobile_no }}</td>
        </tr>
        <tr><td colspan="6" style="padding-top: 7px;"><strong>Mother's Maiden Name <span class="italic">(Last Name, First Name, Middle Name)</span></strong></td></tr>
        <tr><td colspan="6" class="value">{{ $upper(collect([$parents?->mother_maiden_last_name, trim("{$parents?->mother_first_name} {$parents?->mother_middle_name}")])->filter()->implode(', ')) }}</td></tr>
        <tr>
            <td class="label">Occupation:</td><td class="value">{{ $upper($parents?->mother_occupation) }}</td>
            <td class="label" style="padding-left: 8px;">Name of Office:</td><td class="value">{{ $upper($parents?->mother_name_of_office) }}</td>
            <td class="label" style="padding-left: 8px;">Mobile No.</td><td class="value">{{ $parents?->mother_mobile_no }}</td>
        </tr>
    </table>
    @endif

    <div class="bar">For Returnee and Those Who will Transfer/Move In</div>

    <table class="full fields">
        <tr>
            <td class="label">Last Grade Level Completed</td><td class="value" style="width: 26%;">{{ $upper($academicHistory?->last_grade_level_completed) }}</td>
            <td class="label" style="padding-left: 8px;">Last School Year Completed</td><td class="value">{{ $academicHistory?->last_school_year_completed }}</td>
        </tr>
        <tr>
            <td class="label">School Name</td><td class="value">{{ $upper($academicHistory?->previous_school_name) }}</td>
            <td class="label" style="padding-left: 8px;">School ID</td><td class="value">{{ $academicHistory?->previous_school_id }}</td>
        </tr>
        <tr><td class="label">School Address</td><td colspan="3" class="value">{{ $upper($academicHistory?->previous_school_address) }}</td></tr>
    </table>

    <p class="center" style="margin: 10px 0 0;"><strong>ENROLLMENT DATA</strong> (to be completed by the Enrolling Officer)</p>
    <table class="full fields">
        <tr>
            <td class="label">DATE OF APPLICATION:</td><td class="value" style="width: 30%;">{{ $enrollment->date_of_application?->format('F j, Y') }}</td>
            <td class="label" style="padding-left: 8px; text-align: right;">ENROLLMENT STATUS:</td><td class="value">{{ $upper($enrollment->enrollment_status) }}</td>
        </tr>
    </table>
    <p style="margin: 8px 0 0;">
        CREDENTIALS PRESENTED: &nbsp;
        @foreach ($credentials as $label => $presented)
            <span class="box">{{ $tick($presented) }}</span> {{ $label }} &nbsp;
        @endforeach
    </p>

    <table class="full" style="margin-top: 8px;">
        <tr>
            <td style="width: 55%; vertical-align: top;">
                <strong>ASSIGNED TO:</strong>
                <table class="full fields" style="margin-left: 50px; width: 82%;">
                    <tr><td class="label" style="width: 80px;">DEPARTMENT:</td><td class="value">{{ $upper($department) }}</td></tr>
                    <tr><td class="label">LEVEL:</td><td class="value">{{ $upper($enrollment->gradeLevel->name) }}</td></tr>
                    <tr><td class="label">SECTION:</td><td class="value"></td></tr>
                    <tr><td class="label">ADVISER:</td><td class="value"></td></tr>
                </table>
            </td>
            <td style="vertical-align: top; padding-left: 12px;">
                <div class="italic center" style="font-size: 9.5px;">Check the appropriate box only</div>
                <table style="margin-top: 4px;">
                    @foreach ($sessions as $value => $label)
                        <tr>
                            <td style="width: 44px;">@if ($loop->first)TIME:@endif</td>
                            <td style="width: 140px; padding: 1px 0;">{{ $label }}</td>
                            <td><span class="box">{{ $tick($enrollment->session_time_preference === $value) }}</span></td>
                        </tr>
                    @endforeach
                </table>
            </td>
        </tr>
    </table>

    {{-- Page 2: vital information and the tuition fee contract --}}
    <div class="page-break"></div>

    <p style="margin: 0;"><strong>VITAL INFORMATION</strong></p>
    <p style="margin: 6px 0 0;">(Check if appropriate and give particular where necessary)<br>Has the child ever:</p>
    <table class="full vitals">
        <tr>
            <td style="width: 62%;">
                @foreach ($vitals as [$column, $label])
                    <div><span class="check-line">{{ $tick((bool) $vitalInformation?->{$column}) }}</span> {{ $label }}</div>
                @endforeach
            </td>
            <td>
                @foreach ($disciplinaryVitals as [$column, $label])
                    <div><span class="check-line">{{ $tick((bool) $vitalInformation?->{$column}) }}</span> {{ $label }}</div>
                @endforeach
            </td>
        </tr>
    </table>

    <table class="full fields" style="margin-top: 8px;">
        <tr><td class="label" style="width: 80px;">PARTICULARS:</td><td class="value">{{ $vitalInformation?->history_particulars }}</td><td style="width: 15%;"></td></tr>
    </table>
    <table class="full fields" style="margin-top: 6px;">
        <tr>
            <td class="label" style="width: 40px; text-align: right; padding-right: 8px;">a.</td>
            <td class="label" style="width: 110px;">Special health problems of which the school should be aware:</td>
        </tr>
        <tr><td></td><td class="value">{{ $vitalInformation?->special_health_problems }}</td></tr>
    </table>

    <p class="italic justify" style="margin: 18px 0 0; text-indent: 100px;">
        I hereby certify at the best of my knowledge the accuracy and veracity of the information I have provided. If there are by any means changes with regards to these data during the school year, I understand that it is my responsibility to notify the school.
    </p>
    <table class="full signature" style="margin-top: 34px;">
        <tr>
            <td style="width: 46%;"><div class="line">SIGNATURE OVER PRINTED NAME of<br>PARENT/ GUARDIAN</div></td>
            <td></td>
            <td style="width: 28%;"><div class="line">DATE</div></td>
        </tr>
    </table>

    <div class="bar" style="margin-top: 18px;">TUITION FEE CONTRACT AND WITHDRAWAL PROCEDURE</div>

    <table class="full">
        <tr>
            <td style="width: 165px; vertical-align: top;">
                <div class="payment-option">
                    <strong>PAYMENT OPTION:</strong><br>(Please Check)
                    @foreach ($paymentOptions as $value => $label)
                        <div style="margin-top: 6px; padding-left: 12px;"><span class="check-line">{{ $tick($billingContract?->payment_option === $value) }}</span> {{ $label }}</div>
                    @endforeach
                </div>
            </td>
            <td class="justify" style="vertical-align: top; padding-left: 10px;">
                This is to signify that I, <span style="display: inline-block; width: 190px; border-bottom: 1px solid #1a1a1a;">&nbsp;</span> fully
                understand the tuition term of EVIMS. Furthermore, I attest that I fully Comprehend that the registration and miscellaneous fees are non-refundable if I did not continue with my child's enrollment on this school.
                <p style="margin: 6px 0 0; text-indent: 40px;">I also understand that I am subject to withdrawal rules and procedures of the school upon indicating my intention to enroll.</p>
            </td>
        </tr>
    </table>
    <p class="justify" style="margin: 0;">
        In this regard, I acknowledge that if I made a withdrawal of my child's enrollment within the first two weeks of classes, we are subject to be charged 10% of the total annual fee. If withdrawal is made on the third week of classes, we shall be charged 30% of the total annual fee. Furthermore, I also understand that I am responsible to pay the total annual fee if I make a withdrawal within the fourth week of classes and onwards.
    </p>
    <p class="justify" style="margin: 2px 0 0; text-indent: 40px;">
        By signing this document, I acknowledge that I have read, understood and accepted the abovementioned terms and condition.
    </p>
    <table class="full signature" style="margin-top: 34px;">
        <tr>
            <td style="width: 46%;"><div class="line">SIGNATURE OVER PRINTED NAME of<br>PARENT/ GUARDIAN</div></td>
            <td></td>
            <td style="width: 28%;"><div class="line">DATE</div></td>
        </tr>
    </table>

    <p style="margin: 30px 0 0; line-height: 1.9;">
        <span style="padding-left: 60px;"><strong>SUBSCRIBE AND SWORN</strong> to before me this</span> <span style="display: inline-block; width: 120px; border-bottom: 1px solid #1a1a1a;">&nbsp;</span>, affiant Exhibiting to me
        his / her competent evidence of identity <span style="display: inline-block; width: 130px; border-bottom: 1px solid #1a1a1a;">&nbsp;</span>, issued on <span style="display: inline-block; width: 130px; border-bottom: 1px solid #1a1a1a;">&nbsp;</span> at
        <span style="display: inline-block; width: 170px; border-bottom: 1px solid #1a1a1a;">&nbsp;</span>.
    </p>
    <table class="full" style="margin-top: 14px;">
        <tr>
            <td style="width: 45%; line-height: 1.7;">
                Doc. No. <span class="check-line" style="width: 70px;"></span>;<br>
                Page No. <span class="check-line" style="width: 70px;"></span>;<br>
                Book No. <span class="check-line" style="width: 70px;"></span>;<br>
                Series of 20<span class="check-line" style="width: 24px;"></span>
            </td>
            <td style="vertical-align: top;"><strong>NOTARY PUBLIC</strong></td>
        </tr>
    </table>

    {{-- Page 3: what the family enrolled in and will pay --}}
    <div class="page-break"></div>

    <table class="full">
        <tr>
            <td>
                <div class="school" style="text-align: left;">ASSESSMENT OF FEES</div>
                <div>{{ $upper("{$student->last_name}, {$student->first_name} {$student->middle_name}") }} · {{ $enrollment->gradeLevel->name }} · S.Y. {{ $enrollment->school_year }}</div>
                <div>{{ $studentType }} · {{ $session }}</div>
            </td>
            <td style="text-align: right; vertical-align: top;">
                <div>Reference No. <strong style="color: #b23a30;">#{{ $enrollment->id }}</strong></div>
                <div>Issued {{ $issuedOn->format('F j, Y') }}</div>
            </td>
        </tr>
    </table>

    <table class="full" style="margin-top: 12px;">
        <tr>
            <td style="width: 48%; vertical-align: top; padding-right: 8px;">
                <table class="grid">
                    <tr><th style="width: 22px;">#</th><th>Subjects enrolled</th></tr>
                    @forelse ($enrollment->subjects as $subject)
                        <tr>
                            <td>{{ $loop->iteration }}</td>
                            <td>{{ $subject->name }}@if ($subject->code) ({{ $subject->code }})@endif</td>
                        </tr>
                    @empty
                        <tr><td colspan="2">No subjects recorded.</td></tr>
                    @endforelse
                </table>
            </td>
            <td style="vertical-align: top; padding-left: 8px;">
                <table class="grid">
                    <tr><th colspan="2">Fees</th></tr>
                    @if ($curriculum)
                        <tr><td>Registration fee</td><td class="amount">{{ $peso($curriculum->registration_fee) }}</td></tr>
                        <tr><td>Miscellaneous fee</td><td class="amount">{{ $peso($curriculum->miscellaneous_fee) }}</td></tr>
                        @if ((float) $curriculum->books_fee > 0)
                            <tr><td>Books</td><td class="amount">{{ $peso($curriculum->books_fee) }}</td></tr>
                        @endif
                        <tr><td>Tuition ({{ $peso($curriculum->monthly_tuition) }} × {{ $months }} months)</td><td class="amount">{{ $peso($curriculum->monthly_tuition * $months) }}</td></tr>
                        @if ((float) $curriculum->monthly_laboratory_fee > 0)
                            <tr><td>Laboratory ({{ $peso($curriculum->monthly_laboratory_fee) }} × {{ $months }} months)</td><td class="amount">{{ $peso($curriculum->monthly_laboratory_fee * $months) }}</td></tr>
                        @endif
                    @endif
                    <tr class="total">
                        <td>Total</td>
                        <td class="amount">{{ $billingContract ? $peso($billingContract->total_fee) : ($curriculum ? $peso($curriculum->tuition_fee) : '—') }}</td>
                    </tr>
                </table>

                @if ($billingContract)
                    <table class="grid" style="margin-top: 10px;">
                        <tr>
                            <th colspan="3">
                                Payment schedule · {{ $paymentOption ?? $billingContract->payment_option }} ·
                                {{ $billingContract->paysOnline() ? 'Paid online via GCash' : 'Paid at the school cashier' }}
                            </th>
                        </tr>
                        <tr><th style="width: 22px;">#</th><th>Due date</th><th class="amount">Amount</th></tr>
                        @foreach ($billingContract->installments as $installment)
                            <tr>
                                <td>{{ $installment->installment_number }}</td>
                                <td>{{ \Illuminate\Support\Carbon::parse($installment->due_date)->format('M j, Y') }}</td>
                                <td class="amount">{{ $peso($installment->amount_due) }}</td>
                            </tr>
                        @endforeach
                    </table>
                @endif
            </td>
        </tr>
    </table>
</body>
</html>
