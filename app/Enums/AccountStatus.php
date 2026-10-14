<?php

namespace App\Enums;

/**
 * Where a portal (enrollee) account or a self-registered staff account stands
 * in the admin review. Only approved portal accounts may use the portal and
 * pay online, and only approved staff accounts may sign in.
 */
enum AccountStatus: string
{
    case Pending = 'PENDING';
    case Approved = 'APPROVED';
    case Rejected = 'REJECTED';
}
