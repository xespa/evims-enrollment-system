<?php

namespace App\Http\Controllers\Admin;

use App\Enums\AuditAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\IndexAuditLogRequest;
use App\Models\AuditLog;
use App\Models\Enrollment;
use App\Models\User;
use Inertia\Inertia;
use Inertia\Response;

class AuditLogController extends Controller
{
    /**
     * The newest audit entries first, optionally narrowed to one action or
     * one staff member.
     */
    public function index(IndexAuditLogRequest $request): Response
    {
        $filters = [
            'action' => $request->validated('action'),
            'user_id' => $request->validated('user_id'),
        ];

        $entries = AuditLog::query()
            ->with(['user:id,name,email', 'subject'])
            ->when($filters['action'], fn ($query, string $action) => $query->where('action', $action))
            ->when($filters['user_id'], fn ($query, int|string $userId) => $query->where('user_id', $userId))
            ->latestFirst()
            ->paginate(25)
            ->withQueryString()
            ->through(fn (AuditLog $entry): array => [
                'id' => $entry->id,
                'action' => $entry->action->value,
                'action_label' => $entry->action->label(),
                'is_warning' => $entry->action->isWarning(),
                'details' => $entry->details(),
                'actor' => $entry->user?->only(['id', 'name', 'email']),
                'subject' => $this->describeSubject($entry),
                'ip_address' => $entry->ip_address,
                'created_at' => $entry->created_at->toIso8601String(),
            ]);

        return Inertia::render('Admin/AuditLogs/Index', [
            'entries' => $entries,
            'filters' => $filters,
            'actions' => array_map(fn (AuditAction $action): array => [
                'value' => $action->value,
                'label' => $action->label(),
            ], AuditAction::cases()),
            'staff' => User::query()->orderBy('name')->get(['id', 'name']),
        ]);
    }

    /**
     * What the action was done to. Applications are shown by number only,
     * so the log itself holds no student details.
     *
     * @return array{label: string, url: string|null}|null
     */
    private function describeSubject(AuditLog $entry): ?array
    {
        return match (true) {
            $entry->subject instanceof User => ['label' => $entry->subject->name, 'url' => null],
            $entry->subject instanceof Enrollment => [
                'label' => "Application #{$entry->subject->id}",
                'url' => route('admin.enrollments.show', $entry->subject, false),
            ],
            default => null,
        };
    }
}
