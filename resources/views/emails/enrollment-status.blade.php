@component('mail::message')
# Enrollment Application Update

Dear Parent/Guardian,

@if ($status === 'APPROVED')
We are pleased to inform you that **{{ $student->first_name }} {{ $student->last_name }}**'s enrollment application for **{{ $gradeLevel->name }}** (School Year {{ $enrollment->school_year }}) has been **approved**.

Please proceed to settle your tuition payment to secure your child's slot.

@component('mail::button', ['url' => $paymentUrl])
View Payment Details
@endcomponent
@elseif ($status === 'REJECTED')
Thank you for your interest in enrolling **{{ $student->first_name }} {{ $student->last_name }}** for **{{ $gradeLevel->name }}** (School Year {{ $enrollment->school_year }}).

After careful review, we are unable to approve this application at this time.

If you have questions, please reach out to our registrar's office.
@else
Your enrollment application status has been updated to **{{ $status }}**.
@endif

Reference No: #{{ $enrollment->id }}

Thank you,<br>
{{ config('app.name') }}
@endcomponent
