<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

Route::get('/dynamic-home', function () {
    return view('welcome');
});

Route::get('/home-dynamic', function () {
    return view('welcome');
});

Route::fallback(function () {
    return view('welcome');
});
