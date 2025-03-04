<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class FrameHeadersMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        return $next($request);
        $response->header('X-Frame-Options', 'DENY'); // 或 'SAMEORIGIN'
        $response->header('X-Content-Type-Options', 'nosniff');
        return $response;
    }
}
