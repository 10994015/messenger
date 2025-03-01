<?php

namespace App\Traits;

trait MessengerTrait{

    public function timeAgo($timestamp){
        return \Carbon\Carbon::parse($timestamp)->diffForHumans();
    }

}
