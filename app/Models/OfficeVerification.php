<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OfficeVerification extends Model
{
    /**
     * Each document type's file path column and its "verified" flag.
     *
     * @var array<string, array{path: string, verified: string}>
     */
    public const DOCUMENT_COLUMNS = [
        'form_138' => ['path' => 'form_138_path', 'verified' => 'has_form_138'],
        'birth_certificate' => ['path' => 'birth_certificate_path', 'verified' => 'has_birth_certificate'],
        'good_moral' => ['path' => 'good_moral_path', 'verified' => 'has_good_moral_certificate'],
    ];

    protected $fillable = [
        'enrollment_id', 'has_form_138', 'has_birth_certificate',
        'has_good_moral_certificate', 'verified_by', 'verified_at',
        'form_138_path', 'birth_certificate_path', 'good_moral_path',
    ];

    protected $casts = [
        'has_form_138' => 'boolean',
        'has_birth_certificate' => 'boolean',
        'has_good_moral_certificate' => 'boolean',
        'verified_at' => 'datetime',
    ];

    public function enrollment()
    {
        return $this->belongsTo(Enrollment::class);
    }

    public function verifiedBy()
    {
        return $this->belongsTo(User::class, 'verified_by');
    }
}
