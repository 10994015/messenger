<?php

namespace App\Traits;

use Illuminate\Http\Request;

trait FileUploadTrait{
    public function uploadFile(Request $request, string $inputName, ?string $oldPath = null, string $path = '/uploads'){
        if($request->hasFile($inputName)){
            $file = $request->file($inputName);
            $fileName = time().uniqid().'.'.$file->getClientOriginalExtension();
            $file->move(public_path($path), $fileName);
            if($oldPath){
                unlink(public_path($oldPath));
            }
            return $path.'/'.$fileName;
        }

        return $oldPath;
    }
}
