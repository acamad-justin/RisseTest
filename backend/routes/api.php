<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\DB;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
| All routes here are prefixed with /api automatically.
| Add domain-specific routes in separate route files and include them here.
|--------------------------------------------------------------------------
*/

/**
 * Health-check endpoint.
 * GET /api/health
 *
 * Returns the application status and a database connectivity check.
 * Useful for verifying the backend is reachable from the frontend.
 */
Route::get('/health', function () {
    $dbStatus = 'disconnected';

    try {
        DB::connection()->getPdo();
        $dbStatus = 'connected';
    } catch (\Exception $e) {
        $dbStatus = 'error: ' . $e->getMessage();
    }

    return response()->json([
        'status'    => 'ok',
        'app'       => config('app.name'),
        'env'       => config('app.env'),
        'timestamp' => now()->toIso8601String(),
        'database'  => $dbStatus,
    ]);
});

/*
|--------------------------------------------------------------------------
| Authenticated Routes (Sanctum)
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', fn (Request $request) => $request->user());
    // Add authenticated API routes here in future phases.
});
