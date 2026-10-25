<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| is assigned the "api" middleware group. Enjoy building your API!
|
*/

function getProfileData() {
    $file = storage_path('app/profile_data.json');
    if (file_exists($file)) {
        $json = json_decode(file_get_contents($file), true);
        if ($json && isset($json['user'])) {
            return $json;
        }
    }
    
    // Clean initial profile with zero mock data
    $default = [
        'user' => [
            'name' => 'ADRIEL JUSTIN DELA CRUZ',
            'school' => 'Rizal Polytechnic de Muntinlupa',
            'grade' => 'Grade 10',
            'avatar' => null,
        ],
        'stats' => [
            'projects' => 0,
            'mastered' => 0,
            'badges' => 0,
        ],
        'skills' => [],
        'achievements' => [],
        'featuredProjects' => [],
    ];
    
    file_put_contents($file, json_encode($default, JSON_PRETTY_PRINT));
    return $default;
}

function saveProfileData($data) {
    $file = storage_path('app/profile_data.json');
    file_put_contents($file, json_encode($data, JSON_PRETTY_PRINT));
}

Route::get('/profile', function () {
    return response()->json(getProfileData());
});

Route::post('/profile/update', function (Request $request) {
    $data = getProfileData();
    $input = $request->all();
    if (isset($input['user'])) {
        $data['user'] = array_merge($data['user'], $input['user']);
    } else {
        $data['user'] = array_merge($data['user'], $input);
    }
    saveProfileData($data);
    return response()->json([
        'status' => 'success',
        'message' => 'Profile updated successfully',
        'data' => $data,
    ]);
});

Route::post('/profile/award-badge', function (Request $request) {
    $data = getProfileData();
    $input = $request->all();
    if (empty($input)) {
        $input = json_decode($request->getContent(), true) ?? [];
    }
    $badge = $input['badge'] ?? null;
    $skills = $input['skills'] ?? [];

    if ($badge) {
        $exists = false;
        foreach ($data['achievements'] as $ach) {
            if ($ach['title'] === $badge['title']) {
                $exists = true;
                break;
            }
        }
        if (!$exists) {
            $data['achievements'][] = $badge;
            $data['stats']['badges'] = count($data['achievements']);
            $data['stats']['mastered'] = ($data['stats']['mastered'] ?? 0) + 1;
        }
    }

    if (!empty($skills) && is_array($skills)) {
        foreach ($skills as $s) {
            if (!in_array($s, $data['skills'])) {
                $data['skills'][] = $s;
            }
        }
    }

    saveProfileData($data);
    return response()->json([
        'status' => 'success',
        'message' => 'Achievement awarded successfully!',
        'data' => $data,
    ]);
});

Route::post('/profile/reset', function () {
    $file = storage_path('app/profile_data.json');
    if (file_exists($file)) {
        @unlink($file);
    }
    return response()->json(getProfileData());
});

function getModulesData() {
    $file = storage_path('app/modules_data.json');
    if (file_exists($file)) {
        $json = json_decode(file_get_contents($file), true);
        if ($json && isset($json['enrolled']) && isset($json['explore'])) {
            return $json;
        }
    }
    
    // Clean initial modules: 0 enrolled, with Test Module available to enroll
    $default = [
        'enrolled' => [],
        'explore' => [
            [
                'id' => 999,
                'title' => 'Test Module: Quick Progression',
                'level' => 'Beginner',
                'levelColor' => 'yellow',
                'steps' => '3 Learning Steps',
                'skillsAcquired' => 'Rapid Prototyping, Checkpoint Progression, Star Chart Navigation',
                'badge' => 'Speed Learner',
                'status' => 'unregistered',
                'isStarred' => false,
                'actionText' => 'Enroll',
                'description' => 'Fast-track test module to test enrolling, advancing checkpoints from 0, dynamic star chart states, and achievement unlocks.',
            ],
            [
                'id' => 101,
                'title' => 'Sensors & Perception',
                'level' => 'Beginner',
                'levelColor' => 'yellow',
                'steps' => '3 Learning Steps',
                'skillsAcquired' => 'Component Identification, Circuit Assembly, Electrical Signals',
                'badge' => 'Sensor Scout',
                'status' => 'unregistered',
                'isStarred' => false,
                'actionText' => 'Enroll',
            ],
            [
                'id' => 102,
                'title' => 'Programming Robot Behavior',
                'level' => 'Intermediate',
                'levelColor' => 'pink',
                'steps' => '5 Learning Steps',
                'skillsAcquired' => 'Programming Logic, Conditional Behavior, Sensor-Driven Motion',
                'badge' => 'Behavior Programmer',
                'status' => 'unregistered',
                'isStarred' => false,
                'actionText' => 'Enroll',
            ],
            [
                'id' => 103,
                'title' => 'Robotics Fundamentals',
                'level' => 'Beginner',
                'levelColor' => 'yellow',
                'steps' => '4 Learning Steps',
                'skillsAcquired' => 'Circuit Fundamentals, Motor Control, Power Management',
                'badge' => 'Motion Builder',
                'status' => 'unregistered',
                'isStarred' => false,
                'actionText' => 'Enroll',
            ],
            [
                'id' => 104,
                'title' => 'Sumobot Design & Competition',
                'level' => 'Advanced',
                'levelColor' => 'purple',
                'steps' => '6 Learning Steps',
                'skillsAcquired' => 'Mechanical Design, Strategic Programming, Performance Tuning',
                'badge' => 'Sumo Champion',
                'status' => 'unregistered',
                'isStarred' => false,
                'actionText' => 'Enroll',
            ],
            [
                'id' => 105,
                'title' => 'Embedded Microcontroller Architecture',
                'level' => 'Intermediate',
                'levelColor' => 'pink',
                'steps' => '4 Learning Steps',
                'skillsAcquired' => 'Hardware Registers, SPI/I2C Communication, Clock Timers',
                'badge' => 'System Architect',
                'status' => 'unregistered',
                'isStarred' => false,
                'actionText' => 'Enroll',
            ],
            [
                'id' => 106,
                'title' => 'Real-Time Motion Trajectory Planning',
                'level' => 'Advanced',
                'levelColor' => 'purple',
                'steps' => '5 Learning Steps',
                'skillsAcquired' => 'Kinematics Modeling, PID Vector Loops, Actuator Sync',
                'badge' => 'Motion Master',
                'status' => 'unregistered',
                'isStarred' => false,
                'actionText' => 'Enroll',
            ],
        ],
    ];
    
    file_put_contents($file, json_encode($default, JSON_PRETTY_PRINT));
    return $default;
}

function saveModulesData($data) {
    $file = storage_path('app/modules_data.json');
    file_put_contents($file, json_encode($data, JSON_PRETTY_PRINT));
}

Route::get('/modules', function () {
    return response()->json(getModulesData());
});

Route::post('/modules/enroll', function (Request $request) {
    $input = $request->all();
    if (empty($input)) {
        $input = json_decode($request->getContent(), true) ?? [];
    }
    $moduleId = $input['moduleId'] ?? $request->input('moduleId');
    $data = getModulesData();
    
    $targetModule = null;
    foreach ($data['explore'] as &$mod) {
        if ($mod['id'] == $moduleId) {
            $mod['actionText'] = 'Start';
            $mod['status'] = 'active';
            $targetModule = $mod;
            break;
        }
    }
    unset($mod);
    
    if ($targetModule) {
        $alreadyEnrolled = false;
        foreach ($data['enrolled'] as $enr) {
            if ($enr['id'] == $targetModule['id'] || $enr['title'] == $targetModule['title']) {
                $alreadyEnrolled = true;
                break;
            }
        }
        
        if (!$alreadyEnrolled) {
            preg_match('/\d+/', $targetModule['steps'], $matches);
            $totalSteps = isset($matches[0]) ? (int)$matches[0] : 3;
            
            $firstPath = ($targetModule['id'] == 999) 
                ? 'Orientation & Basics' 
                : 'Inputs, Output, and Signals';

            $data['enrolled'][] = [
                'id' => $targetModule['id'],
                'title' => $targetModule['title'],
                'subtitle' => $targetModule['level'] . ' • Not Started',
                'theme' => $targetModule['levelColor'] ?? 'yellow',
                'currentStep' => 0, // Starts at progress 0!
                'totalSteps' => $totalSteps,
                'progressPercent' => 0, // Starts at 0%!
                'currentPath' => $firstPath,
                'badge' => $targetModule['badge'] ?? 'Module Achiever',
            ];
        }
    }
    
    saveModulesData($data);
    
    return response()->json([
        'status' => 'success',
        'message' => 'Successfully enrolled in module',
        'moduleId' => $moduleId,
        'enrolled' => $data['enrolled'],
        'explore' => $data['explore'],
    ]);
});

Route::post('/modules/progress', function (Request $request) {
    $input = $request->all();
    if (empty($input)) {
        $input = json_decode($request->getContent(), true) ?? [];
    }
    $moduleId = $input['moduleId'] ?? null;
    $step = isset($input['step']) ? (int)$input['step'] : null;
    $path = $input['path'] ?? null;
    
    $data = getModulesData();
    $updatedModule = null;
    
    foreach ($data['enrolled'] as &$enr) {
        if ((string)$enr['id'] === (string)$moduleId) {
            if ($step !== null) {
                $enr['currentStep'] = min($enr['totalSteps'], max(0, $step));
                $enr['progressPercent'] = round(($enr['currentStep'] / $enr['totalSteps']) * 100);
                if ($enr['currentStep'] >= $enr['totalSteps']) {
                    $enr['subtitle'] = 'Completed! (100%)';
                    foreach ($data['explore'] as &$m) {
                        if ((string)$m['id'] === (string)$moduleId) {
                            $m['status'] = 'completed';
                            $m['actionText'] = 'Review';
                            break;
                        }
                    }
                    unset($m);
                } elseif ($enr['currentStep'] > 0) {
                    $enr['subtitle'] = 'Step ' . $enr['currentStep'] . ' of ' . $enr['totalSteps'];
                } else {
                    $enr['subtitle'] = 'Not Started (0%)';
                }
            }
            if ($path) {
                $enr['currentPath'] = $path;
            }
            $updatedModule = $enr;
            break;
        }
    }
    unset($enr);
    
    saveModulesData($data);
    
    return response()->json([
        'status' => 'success',
        'module' => $updatedModule,
        'enrolled' => $data['enrolled'],
    ]);
});

Route::post('/modules/favorite', function (Request $request) {
    $input = $request->all();
    if (empty($input)) {
        $input = json_decode($request->getContent(), true) ?? [];
    }
    $moduleId = $input['moduleId'] ?? $request->input('moduleId');
    $isStarred = $input['isStarred'] ?? $request->input('isStarred');
    $data = getModulesData();
    
    foreach ($data['explore'] as &$mod) {
        if ($mod['id'] == $moduleId) {
            $mod['isStarred'] = (bool)$isStarred;
            break;
        }
    }
    unset($mod);
    
    saveModulesData($data);
    
    return response()->json([
        'status' => 'success',
        'message' => 'Favorite updated successfully',
        'moduleId' => $moduleId,
        'isStarred' => $isStarred,
    ]);
});

Route::post('/modules/unenroll', function (Request $request) {
    $moduleId = $request->input('moduleId') 
        ?? $request->json('moduleId') 
        ?? ($request->isJson() ? ($request->json()->all()['moduleId'] ?? null) : null);
    if (!$moduleId) {
        $raw = json_decode($request->getContent(), true);
        $moduleId = $raw['moduleId'] ?? null;
    }
    $data = getModulesData();
    
    $data['enrolled'] = array_values(array_filter($data['enrolled'], function ($enr) use ($moduleId) {
        return (string)$enr['id'] !== (string)$moduleId;
    }));
    
    foreach ($data['explore'] as &$mod) {
        if ((string)$mod['id'] === (string)$moduleId) {
            $mod['actionText'] = 'Enroll';
            $mod['status'] = 'unregistered';
            break;
        }
    }
    unset($mod);
    
    saveModulesData($data);
    
    return response()->json([
        'status' => 'success',
        'message' => 'Successfully unenrolled from module',
        'moduleId' => $moduleId,
        'enrolled' => $data['enrolled'],
        'explore' => $data['explore'],
    ]);
});

Route::post('/modules/reset', function () {
    $file = storage_path('app/modules_data.json');
    if (file_exists($file)) {
        @unlink($file);
    }
    return response()->json(getModulesData());
});

Route::match(['POST', 'OPTIONS'], '/chat', function (Request $request) {
    if ($request->isMethod('OPTIONS')) {
        return response('', 204)
            ->header('Access-Control-Allow-Origin', '*')
            ->header('Access-Control-Allow-Methods', 'POST, OPTIONS')
            ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    }

    $hotFile = public_path('hot');
    $hotUrl = null;
    if (file_exists($hotFile)) {
        $hotUrl = rtrim(trim(file_get_contents($hotFile)), '/') . '/api/chat';
    }

    $endpoints = array_filter([
        env('CHAT_API_URL'),
        $hotUrl,
        'http://127.0.0.1:5173/api/chat',
        'http://localhost:5173/api/chat',
        'http://[::1]:5173/api/chat',
    ]);

    $targetUrl = 'http://127.0.0.1:5173/api/chat';
    foreach ($endpoints as $url) {
        $chTest = curl_init($url);
        curl_setopt($chTest, CURLOPT_CUSTOMREQUEST, 'OPTIONS');
        curl_setopt($chTest, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($chTest, CURLOPT_CONNECTTIMEOUT_MS, 300);
        curl_setopt($chTest, CURLOPT_TIMEOUT_MS, 400);
        curl_exec($chTest);
        $code = curl_getinfo($chTest, CURLINFO_HTTP_CODE);
        curl_close($chTest);
        if ($code === 200 || $code === 204) {
            $targetUrl = $url;
            break;
        }
    }

    $payload = json_encode($request->all());

    return response()->stream(function () use ($targetUrl, $payload) {
        $ch = curl_init($targetUrl);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            'Accept: text/plain, */*',
        ]);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
        curl_setopt($ch, CURLOPT_WRITEFUNCTION, function ($ch, $data) {
            echo $data;
            if (ob_get_level() > 0) {
                ob_flush();
            }
            flush();
            return strlen($data);
        });
        curl_setopt($ch, CURLOPT_TIMEOUT, 60);
        curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 5);

        $executed = curl_exec($ch);
        if ($executed === false) {
            $err = curl_error($ch);
            echo "Error connecting to AI chat service ($err). Target: $targetUrl";
        }
        curl_close($ch);
    }, 200, [
        'Content-Type' => 'text/plain; charset=utf-8',
        'Cache-Control' => 'no-cache, no-transform',
        'X-Accel-Buffering' => 'no',
        'Access-Control-Allow-Origin' => '*',
    ]);
});


