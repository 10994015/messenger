<?php

namespace App\Http\Controllers;

use App\Traits\FileUploadTrait;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class UserProfileController extends Controller
{
    use FileUploadTrait;
    public function update(Request $request)
    {
        // Update the user's profile...
        $request->validate([
            'avatar' => 'nullable|image|max:1024',
            'name' => 'required|string|max:255',
            'user_name'=> 'required|string|max:50|unique:users,user_name,'.Auth::id(),
            'email' => 'required|string|email|max:255',
        ]);

        $avatarPath = $this->uploadFile($request, 'avatar');

        $user = Auth::user();
        if($avatarPath) $user->avatar = $avatarPath;
        $user->name = $request->name;
        $user->user_name = $request->user_name;
        $user->email = $request->email;
        if($request->filled('current_password')){
            $request->validate([
                'current_password' => 'required|current_password',
                'password' => 'required|string|min:8|confirmed',
            ]);
            $user->password = bcrypt($request->password);
        }
        $user->save();

        notyf()->addSuccess('Updated successfully!');

        return response()->json(['message' => 'Profile updated successfully'], 200);

    }
}
