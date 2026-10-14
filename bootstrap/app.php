<?php

use App\Enums\AccountRole;
use App\Http\Middleware\EnsureEnrolleeIsApproved;
use App\Http\Middleware\EnsureStaffIsActive;
use App\Http\Middleware\EnsureTwoFactorIsEnabled;
use App\Http\Middleware\HandleAppearance;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\RedirectIfEnrolleeAuthenticated;
use App\Http\Middleware\RedirectIfStudentAuthenticated;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->encryptCookies(except: ['appearance', 'sidebar_state']);

        $middleware->web(append: [
            HandleAppearance::class,
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);

        // Everyone signs in on the same page; student pages preselect the
        // Student role so the LRN field is ready.
        $middleware->redirectGuestsTo(fn (Request $request) => $request->routeIs('student.*')
            ? route('login', ['role' => AccountRole::Student->value])
            : route('login'));

        $middleware->alias([
            'staff.active' => EnsureStaffIsActive::class,
            'two-factor.required' => EnsureTwoFactorIsEnabled::class,
            'guest.enrollee' => RedirectIfEnrolleeAuthenticated::class,
            'enrollee.approved' => EnsureEnrolleeIsApproved::class,
            'guest.student' => RedirectIfStudentAuthenticated::class,
        ]);

        $middleware->validateCsrfTokens(except: [
            'paymongo/webhook',
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );
    })->create();
