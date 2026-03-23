<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$downloadDir = __DIR__ . '/../downloads';
if (!is_dir($downloadDir)) {
    echo json_encode(['songs' => []]);
    exit;
}

$files = glob($downloadDir . '/*.{mp3,m4a,opus,webm,ogg,wav}', GLOB_BRACE);
if (empty($files)) {
    echo json_encode(['songs' => []]);
    exit;
}

// Sort newest first
usort($files, function ($a, $b) {
    return filemtime($b) - filemtime($a);
});

$songs = [];
foreach ($files as $file) {
    $filename = basename($file);
    $title = pathinfo($filename, PATHINFO_FILENAME);
    $title = str_replace('_', ' ', $title);

    $songs[] = [
        'id' => 'dl-' . md5($filename),
        'title' => $title,
        'artist' => 'YouTube',
        'file' => 'downloads/' . $filename,
        'size' => filesize($file),
        'date' => date('Y-m-d H:i', filemtime($file)),
    ];
}

echo json_encode(['songs' => $songs]);
