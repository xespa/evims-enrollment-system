<?php

namespace App\Enums;

/**
 * Where a portal (enrollee) account stands in the admin review. Only approved
 * accounts may use the portal and pay online.
 */
enum AccountStatus: string
{
    case Pending = 'PENDING';
    case Approved = 'APPROVED';
    case Rejected = 'REJECTED';
}
