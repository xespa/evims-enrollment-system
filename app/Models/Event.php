<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Event extends Model
{
    protected $fillable = [
        'title', 'tag', 'event_date', 'start_time', 'end_time',
        'location', 'description', 'image_path',
    ];

    protected $casts = [
        'event_date' => 'date',
    ];
}
