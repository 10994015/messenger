<?php

if(!function_exists('timeAgo')){
    function timeAgo($timestamp){
        return \Carbon\Carbon::parse($timestamp)->diffForHumans();
    }
}
