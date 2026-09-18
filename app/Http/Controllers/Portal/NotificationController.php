<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;

class NotificationController extends Controller
{
    public function index(): JsonResponse
    {
        $enrollee = Auth::guard('enrollee')->user();

        $notifications = $enrollee->notifications()
            ->latest()
            ->limit(10)
            ->get(['id', 'data', 'read_at', 'created_at']);

        return response()->json([
            'notifications' => $notifications,
            'unread_count' => $enrollee->unreadNotifications()->count(),
        ]);
    }

    public function read(string $notification): RedirectResponse
    {
        $enrollee = Auth::guard('enrollee')->user();

        $enrollee->notifications()->where('id', $notification)->first()?->markAsRead();

        return back();
    }

    public function readAll(): RedirectResponse
    {
        Auth::guard('enrollee')->user()->unreadNotifications()->update(['read_at' => now()]);

        return back();
    }
}
