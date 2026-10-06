<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateProfilePhotoRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ProfilePhotoController extends Controller
{
    /**
     * Replace the admin's profile photo, removing the old file.
     */
    public function update(UpdateProfilePhotoRequest $request): RedirectResponse
    {
        $user = $request->user();
        $previousPath = $user->profile_photo_path;

        $user->update([
            'profile_photo_path' => $request->file('photo')->store('avatars', 'public'),
        ]);

        if ($previousPath) {
            Storage::disk('public')->delete($previousPath);
        }

        return back()->with('success', 'Profile photo updated.');
    }

    /**
     * Remove the admin's profile photo, falling back to their initials.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $user = $request->user();

        if ($user->profile_photo_path) {
            Storage::disk('public')->delete($user->profile_photo_path);

            $user->update(['profile_photo_path' => null]);
        }

        return back()->with('success', 'Profile photo removed.');
    }
}
