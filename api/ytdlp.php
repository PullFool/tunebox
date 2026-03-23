<?php
function findYtDlp() {
    // Use python with PYTHONPATH pointing to user site-packages
    $pythonExe = 'C:\\Python314\\python.exe';
    $userSitePackages = 'C:\\Users\\Adrian\\AppData\\Roaming\\Python\\Python314\\site-packages';
    if (file_exists($pythonExe)) {
        putenv("PYTHONPATH=$userSitePackages");
        $out = [];
        exec("\"$pythonExe\" -m yt_dlp --version 2>&1", $out, $code);
        if ($code === 0) return "\"$pythonExe\" -m yt_dlp";
    }

    // Try direct command
    $paths = ['yt-dlp', 'yt-dlp.exe'];
    foreach ($paths as $path) {
        $out = [];
        exec("$path --version 2>&1", $out, $code);
        if ($code === 0) return $path;
    }

    // Try python module
    $pythonPaths = ['C:\\Python314\\python.exe', 'python', 'python3', 'py'];
    foreach ($pythonPaths as $py) {
        $out = [];
        exec("\"$py\" -m yt_dlp --version 2>&1", $out, $code);
        if ($code === 0) return "\"$py\" -m yt_dlp";
    }

    // Scan common Windows install locations
    $scanDirs = [
        'C:\\Python314\\Scripts',
        'C:\\Python312\\Scripts',
        'C:\\Python311\\Scripts',
        'C:\\Users\\Adrian\\AppData\\Roaming\\Python\\Python*\\Scripts',
        'C:\\Users\\Adrian\\AppData\\Local\\Programs\\Python\\Python*\\Scripts',
    ];

    foreach ($scanDirs as $pattern) {
        $matches = glob($pattern . '\\yt-dlp.exe');
        if ($matches) return "\"" . $matches[0] . "\"";
    }

    return null;
}
