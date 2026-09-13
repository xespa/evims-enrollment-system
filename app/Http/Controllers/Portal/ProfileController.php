<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class ProfileController extends Controller
{
    public function updatePhoto(Request $request): RedirectResponse
    {
        $request->validate([
            'photo' => ['required', 'image', 'max:2048'],
        ]);

        $enrollee = Auth::guard('enrollee')->user();

        if ($enrollee->profile_photo_path) {
            Storage::disk('public')->delete($enrollee->profile_photo_path);
        }

        $enrollee->update([
            'profile_photo_path' => $request->file('photo')->store('avatars', 'public'),
        ]);

        return back()->with('success', 'Profile photo updated.');
    }
}
