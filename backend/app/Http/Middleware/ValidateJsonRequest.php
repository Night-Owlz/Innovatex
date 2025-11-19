<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ValidateJsonRequest
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->isMethod('POST') || $request->isMethod('PUT') || $request->isMethod('PATCH')) {
            if (!$request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Request must accept JSON response',
                ], Response::HTTP_NOT_ACCEPTABLE);
            }

            if ($request->hasHeader('Content-Type') && 
                !str_contains($request->header('Content-Type'), 'application/json') &&
                !str_contains($request->header('Content-Type'), 'multipart/form-data')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Content-Type must be application/json or multipart/form-data',
                ], Response::HTTP_UNSUPPORTED_MEDIA_TYPE);
            }
        }

        return $next($request);
    }
}
