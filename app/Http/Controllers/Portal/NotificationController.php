<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;

class NotificationController extends Controller
{
    /**
     * How many of the latest notifications the bell shows.
     */
    private const LIMIT = 20;

    public function index(): JsonResponse
    {
        $enrollee = Auth::guard('enrollee')->user();

        $notifications = $enrollee->notifications()
            ->latest()
            ->limit(self::LIMIT)
            ->get(['id', 'data', 'read_at', 'created_at']);

        return response()->json([
            'notifications' => $notifications,
            'unread_count' => $enrollee->unreadNotifications()->count(),
        ]);
    }

    /**
     * Answers background (JSON) requests with no content, so the bell can
     * mark a notification read without an Inertia visit — one that the
     * visit to the notification's page would otherwise cancel.
     */
    public function read(Request $request, string $notification): RedirectResponse|Response
    {
        $enrollee = Auth::guard('enrollee')->user();

        $enrollee->notifications()->where('id', $notification)->first()?->markAsRead();

        return $request->expectsJson() ? response()->noContent() : back();
    }

    public function readAll(Request $request): RedirectResponse|Response
    {
        Auth::guard('enrollee')->user()->unreadNotifications()->update(['read_at' => now()]);

        return $request->expectsJson() ? response()->noContent() : back();
    }
}
