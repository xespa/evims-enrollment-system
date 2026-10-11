@component('mail::message')
# Registration Form

Dear Parent/Guardian,

**{{ $student->first_name }} {{ $student->last_name }}** is now registered for **{{ $gradeLevel->name }}**, School Year {{ $enrollment->school_year }}. Their registration form is attached as a PDF.

It lists the subjects your child is enrolled in, the assessment of fees, and the payment schedule. Please keep a copy for your records and bring it when you visit the school.

You can download it again any time from the student portal.

@component('mail::button', ['url' => $portalUrl])
Open the Student Portal
@endcomponent

Reference No: #{{ $enrollment->id }}

Thank you,<br>
{{ config('app.name') }}
@endcomponent
