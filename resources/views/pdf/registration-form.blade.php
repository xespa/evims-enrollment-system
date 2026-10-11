@php
    $peso = fn ($amount) => '₱'.number_format((float) $amount, 2);
    $months = \App\Models\Curriculum::BILLABLE_MONTHS;
@endphp
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>Registration Form — {{ $student->first_name }} {{ $student->last_name }}</title>
    <style>
        @page { margin: 28px 34px 48px; }
        * { box-sizing: border-box; }
        body { font-family: 'DejaVu Sans', sans-serif; font-size: 10px; color: #1f2a24; line-height: 1.35; }
        table { width: 100%; border-collapse: collapse; }
        .header td { vertical-align: middle; }
        .school { font-size: 15px; font-weight: bold; letter-spacing: 0.3px; }
        .muted { color: #5b645f; }
        .title { margin: 10px 0 2px; font-size: 14px; font-weight: bold; text-align: center; letter-spacing: 1px; }
        .subtitle { text-align: center; margin-bottom: 10px; }
        .ref { text-align: right; vertical-align: top; }
        .ref strong { color: #b23a30; font-size: 13px; }
        h2 { margin: 12px 0 4px; padding: 3px 6px; font-size: 10px; letter-spacing: 0.8px; text-transform: uppercase; background: #2f6f4e; color: #ffffff; }
        .fields td { padding: 3px 6px; border: 1px solid #d5d9d6; vertical-align: top; }
        .fields .label { width: 18%; background: #f4f1ea; color: #5b645f; font-size: 9px; }
        .grid th, .grid td { padding: 3px 6px; border: 1px solid #d5d9d6; text-align: left; }
        .grid th { background: #f4f1ea; font-size: 9px; color: #5b645f; }
        .amount { text-align: right !important; white-space: nowrap; }
        .total td { font-weight: bold; background: #f4f1ea; }
        .two-col td.col { width: 50%; vertical-align: top; padding: 0; }
        .two-col td.col:first-child { padding-right: 6px; }
        .two-col td.col:last-child { padding-left: 6px; }
        .signatures { margin-top: 28px; }
        .signatures td { width: 50%; padding: 0 18px; text-align: center; vertical-align: bottom; }
        .line { border-top: 1px solid #1f2a24; padding-top: 3px; }
        /* Sits in the bottom page margin, so a long payment schedule can't push it onto a page of its own. */
        .footer { position: fixed; left: 0; right: 0; bottom: -30px; font-size: 8px; text-align: center; color: #5b645f; }
    </style>
</head>
<body>
    <table class="header">
        <tr>
            @if ($logo)
                <td style="width: 62px;"><img src="{{ $logo }}" alt="" style="width: 56px; height: 56px;"></td>
            @endif
            <td>
                <div class="school">EASTERN VISAYAS INTERNATIONAL MONTESSORI SCHOOL</div>
                <div class="muted">Brgy. Balud, Borongan City, Eastern Samar</div>
            </td>
            <td class="ref">
                <div class="muted">Reference No.</div>
                <strong>#{{ $enrollment->id }}</strong>
                <div class="muted">Issued {{ $issuedOn->format('F j, Y') }}</div>
            </td>
        </tr>
    </table>

    <div class="title">REGISTRATION FORM</div>
    <div class="subtitle muted">School Year {{ $enrollment->school_year }}</div>

    <h2>Student information</h2>
    <table class="fields">
        <tr>
            <td class="label">Name</td>
            <td colspan="3"><strong>{{ $student->last_name }}, {{ $student->first_name }} {{ $student->middle_name }} {{ $student->extension_name }}</strong></td>
        </tr>
        <tr>
            <td class="label">LRN</td>
            <td>{{ $student->lrn ?: '—' }}</td>
            <td class="label">Sex</td>
            <td>{{ $student->sex ? ucfirst(strtolower($student->sex)) : '—' }}</td>
        </tr>
        <tr>
            <td class="label">Date of birth</td>
            <td>{{ $student->date_of_birth ? $student->date_of_birth->format('F j, Y') : '—' }}</td>
            <td class="label">Age</td>
            <td>{{ $enrollment->age ?? '—' }}</td>
        </tr>
        <tr>
            <td class="label">Address</td>
            <td colspan="3">
                @if ($address)
                    {{ collect([$address->house_number_street, $address->barangay, $address->city_municipality, $address->province, $address->zip_code])->filter()->implode(', ') }}
                @else
                    —
                @endif
            </td>
        </tr>
    </table>

    <h2>Enrollment</h2>
    <table class="fields">
        <tr>
            <td class="label">Grade level</td>
            <td><strong>{{ $enrollment->gradeLevel->name }}</strong></td>
            <td class="label">School year</td>
            <td>{{ $enrollment->school_year }}</td>
        </tr>
        <tr>
            <td class="label">Student type</td>
            <td>{{ $studentType }}</td>
            <td class="label">Session</td>
            <td>{{ $session }}</td>
        </tr>
    </table>

    <h2>Parents / guardian</h2>
    <table class="fields">
        <tr>
            <td class="label">Father</td>
            <td>{{ $parents ? trim("{$parents->father_first_name} {$parents->father_middle_name} {$parents->father_last_name}") ?: '—' : '—' }}</td>
            <td class="label">Mobile no.</td>
            <td>{{ $parents?->father_mobile_no ?: '—' }}</td>
        </tr>
        <tr>
            <td class="label">Mother</td>
            <td>{{ $parents ? trim("{$parents->mother_first_name} {$parents->mother_middle_name} {$parents->mother_maiden_last_name}") ?: '—' : '—' }}</td>
            <td class="label">Mobile no.</td>
            <td>{{ $parents?->mother_mobile_no ?: '—' }}</td>
        </tr>
        <tr>
            <td class="label">Email</td>
            <td colspan="3">{{ $enrollment->email ?: '—' }}</td>
        </tr>
    </table>

    <table class="two-col" style="margin-top: 0;">
        <tr>
            <td class="col">
                <h2>Subjects enrolled</h2>
                <table class="grid">
                    <tr><th style="width: 22px;">#</th><th>Subject</th></tr>
                    @forelse ($enrollment->subjects as $subject)
                        <tr>
                            <td>{{ $loop->iteration }}</td>
                            <td>{{ $subject->name }}@if ($subject->code) <span class="muted">({{ $subject->code }})</span>@endif</td>
                        </tr>
                    @empty
                        <tr><td colspan="2" class="muted">No subjects recorded.</td></tr>
                    @endforelse
                </table>
            </td>
            <td class="col">
                <h2>Assessment of fees</h2>
                <table class="grid">
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
                    <h2>Payment schedule</h2>
                    <p style="margin: 0 0 4px;">
                        {{ $paymentOption ?? $billingContract->payment_option }} ·
                        {{ $billingContract->paysOnline() ? 'Paid online via GCash' : 'Paid at the school cashier' }}
                    </p>
                    <table class="grid">
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

    <table class="signatures">
        <tr>
            <td><div class="line">Parent / Guardian<br><span class="muted">Signature over printed name</span></div></td>
            <td><div class="line">Registrar<br><span class="muted">Signature over printed name</span></div></td>
        </tr>
    </table>

    <div class="footer">
        This registration form was issued when the application was approved. Please keep it for your records and bring it when you visit the school.
    </div>
</body>
</html>
