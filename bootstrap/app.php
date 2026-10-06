<?php

use App\Http\Middleware\EnsureEnrolleeIsApproved;
use App\Http\Middleware\EnsureStaffIsActive;
use App\Http\Middleware\EnsureTwoFactorIsEnabled;
use App\Http\Middleware\HandleAppearance;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\RedirectIfEnrolleeAuthenticated;
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

        // Families sign in on the portal; the Fortify login is for school staff.
        $middleware->redirectGuestsTo(fn (Request $request) => $request->routeIs('portal.*', 'admission.*')
            ? route('portal.login')
            : route('login'));

        $middleware->alias([
            'staff.active' => EnsureStaffIsActive::class,
            'two-factor.required' => EnsureTwoFactorIsEnabled::class,
            'guest.enrollee' => RedirectIfEnrolleeAuthenticated::class,
            'enrollee.approved' => EnsureEnrolleeIsApproved::class,
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
