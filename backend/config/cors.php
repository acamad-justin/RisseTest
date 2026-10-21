<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS)
    |--------------------------------------------------------------------------
    | Controls which origins, methods, and headers are allowed when the
    | Vue frontend makes cross-origin API requests to this Laravel backend.
    |
    | For local development, the Vite dev server origin is listed explicitly.
    | Never use a wildcard ('*') when credentials (cookies/tokens) are sent.
    |--------------------------------------------------------------------------
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],

    'allowed_origins' => [
        'http://localhost:5173',   // Vite dev server (default)
        'http://127.0.0.1:5173',  // Alternate Vite address
    ],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],

    'exposed_headers' => [],

    'max_age' => 0,

    /*
    | Set to true when you enable Sanctum cookie-based SPA authentication.
    | Keep false for stateless Bearer token auth.
    */
    'supports_credentials' => false,

];
