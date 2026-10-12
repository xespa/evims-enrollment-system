@php
    $money = fn ($amount) => number_format((float) $amount, 2);
    $isCheck = $paymentForm === 'CHECK';
    // The booklet's settlement table has room for this many particulars.
    $blankRows = max(0, 8 - count($particulars));
@endphp
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>Acknowledgement Receipt No. {{ $receiptNumber }}</title>
    <style>
        @page { margin: 20px 24px; }
        * { box-sizing: border-box; }
        body { font-family: 'DejaVu Sans', sans-serif; font-size: 9px; color: #1a1a1a; }
        table { border-collapse: collapse; }
        .layout { width: 100%; }
        .layout > tbody > tr > td { vertical-align: top; }
        .settlement-col { width: 37%; padding-right: 14px; }

        .settlement { width: 100%; }
        .settlement td, .settlement th { border: 1px solid #1a1a1a; padding: 3px 5px; height: 18px; }
        .settlement th { font-size: 8.5px; font-weight: bold; text-align: center; }
        .settlement .amount { text-align: right; width: 42%; white-space: nowrap; }
        .settlement .label { font-weight: bold; font-size: 8.5px; }
        .settlement .label-narrow { width: 34%; font-weight: bold; font-size: 8.5px; }
        .box { display: inline-block; width: 9px; height: 9px; border: 1px solid #1a1a1a; text-align: center; line-height: 8px; font-size: 8px; margin-right: 3px; }

        .letterhead td { vertical-align: middle; }
        .school { font-size: 13px; font-weight: bold; text-align: center; line-height: 1.15; }
        .school-details { font-size: 8px; text-align: center; color: #444444; }
        .number { color: #c0262d; font-family: 'DejaVu Serif', serif; font-size: 15px; text-align: right; margin: 6px 4px 0 0; }
        .title { font-size: 12px; font-weight: bold; margin: 2px 0 12px; }

        .fields { width: 100%; }
        .fields td { padding: 9px 0 0; vertical-align: bottom; white-space: nowrap; }
        .fields .fill { border-bottom: 1px solid #1a1a1a; width: 100%; white-space: normal; padding-left: 4px; font-size: 9.5px; }
        .struck { text-decoration: line-through; }

        .signature { width: 62%; margin: 40px 0 0 auto; }
        .signature td { vertical-align: bottom; white-space: nowrap; }
        .signature .fill { border-bottom: 1px solid #1a1a1a; width: 100%; text-align: center; font-size: 9.5px; }
        .signature .caption { text-align: center; font-size: 8px; padding-top: 1px; }
    </style>
</head>
<body>
    <table class="layout">
        <tr>
            <td class="settlement-col">
                <table class="settlement">
                    <tr><th colspan="2">IN SETTLEMENT OF THE FOLLOWING</th></tr>
                    <tr><th>PARTICULAR</th><th>AMOUNT</th></tr>
                    @foreach ($particulars as $particular)
                        <tr>
                            <td>{{ $particular['label'] }}</td>
                            <td class="amount">{{ $money($particular['amount']) }}</td>
                        </tr>
                    @endforeach
                    @for ($row = 0; $row < $blankRows; $row++)
                        <tr><td></td><td></td></tr>
                    @endfor
                    <tr>
                        <td class="label">AMOUNT DUE</td>
                        <td class="amount">{{ $money($amountDue) }}</td>
                    </tr>
                    <tr>
                        <th>TOTAL PAYMENT</th>
                        <td class="amount"><strong>{{ $money($total) }}</strong></td>
                    </tr>
                    <tr>
                        <td><span class="box">{{ $isCheck ? '' : '✓' }}</span>CASH</td>
                        <td><span class="box">{{ $isCheck ? '✓' : '' }}</span>CHECK</td>
                    </tr>
                    <tr>
                        <td class="label-narrow">BANK</td>
                        <td>{{ $checkBank }}</td>
                    </tr>
                    <tr>
                        <td class="label-narrow">CHECK NO.</td>
                        <td>{{ $checkNumber }}</td>
                    </tr>
                    <tr>
                        <td class="label-narrow">CHECK DATE</td>
                        <td>{{ $checkDate?->format('M j, Y') }}</td>
                    </tr>
                </table>
            </td>

            <td>
                <table class="letterhead" style="width: 100%;">
                    <tr>
                        <td style="width: 64px;">
                            @if ($logo)
                                <img src="{{ $logo }}" alt="" style="width: 58px; height: 58px;">
                            @endif
                        </td>
                        <td>
                            <div class="school">EASTERN VISAYAS INTERNATIONAL<br>MONTESSORI SCHOOL</div>
                            <div class="school-details">Brgy. Balud, Borongan, Eastern Samar</div>
                            <div class="school-details">NON VAT Reg. TIN: 005-381-118-000</div>
                        </td>
                    </tr>
                </table>

                <div class="number">№ &nbsp; {{ $receiptNumber }}</div>
                <div class="title">ACKNOWLEDGEMENT RECEIPT</div>

                <table class="fields">
                    <tr>
                        <td style="width: 45%;"></td>
                        <td>Date&nbsp;</td>
                        <td class="fill">{{ $paidOn?->format('F j, Y') }}</td>
                    </tr>
                </table>
                <table class="fields">
                    <tr>
                        <td>RECEIVED from&nbsp;</td>
                        <td class="fill">{{ $receivedFrom }}</td>
                    </tr>
                </table>
                <table class="fields">
                    <tr>
                        <td>Address&nbsp;</td>
                        <td class="fill">{{ $address }}</td>
                    </tr>
                </table>
                <table class="fields">
                    <tr>
                        <td>the sum of&nbsp;</td>
                        <td class="fill">{{ $totalInWords }}</td>
                    </tr>
                </table>
                <table class="fields">
                    <tr>
                        <td class="fill" style="width: 55%;"></td>
                        <td>&nbsp;Pesos (₱&nbsp;</td>
                        <td class="fill" style="width: 45%;">{{ $money($total) }}</td>
                        <td>&nbsp;)</td>
                    </tr>
                </table>
                <table class="fields">
                    <tr>
                        <td>in <span class="{{ $isFullPayment ? '' : 'struck' }}">full</span>/<span class="{{ $isFullPayment ? 'struck' : '' }}">partial</span> payment for&nbsp;</td>
                        <td class="fill">{{ $paymentFor }}</td>
                    </tr>
                </table>

                <table class="signature">
                    <tr>
                        <td>By:&nbsp;</td>
                        <td class="fill">{{ $cashier }}</td>
                    </tr>
                    <tr>
                        <td></td>
                        <td class="caption">Cashier/Authorized Representative</td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
