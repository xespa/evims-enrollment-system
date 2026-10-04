<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

/**
 * The admin's notification bell; mirrors the portal's.
 */
class NotificationController extends Controller
{
    /**
     * How many of the latest notifications the bell shows.
     */
    private const LIMIT = 20;

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $notifications = $user->notifications()
            ->latest()
            ->limit(self::LIMIT)
            ->get(['id', 'data', 'read_at', 'created_at']);

        return response()->json([
            'notifications' => $notifications,
            'unread_count' => $user->unreadNotifications()->count(),
        ]);
    }

    /**
     * Answers background (JSON) requests with no content, so the bell can
     * mark a notification read without an Inertia visit.
     */
    public function read(Request $request, string $notification): RedirectResponse|Response
    {
        $request->user()->notifications()->where('id', $notification)->first()?->markAsRead();

        return $request->expectsJson() ? response()->noContent() : back();
    }

    public function readAll(Request $request): RedirectResponse|Response
    {
        $request->user()->unreadNotifications()->update(['read_at' => now()]);

        return $request->expectsJson() ? response()->noContent() : back();
    }
}
