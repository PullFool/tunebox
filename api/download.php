<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once __DIR__ . '/ytdlp.php';

$input = json_decode(file_get_contents('php://input'), true);
$url = $input['url'] ?? '';

if (empty($url)) {
    echo json_encode(['error' => 'No URL provided']);
    exit;
}

if (!preg_match('/youtube\.com|youtu\.be/', $url)) {
    echo json_encode(['error' => 'Invalid YouTube URL']);
    exit;
}

$ytdlp = findYtDlp();
if (!$ytdlp) {
    echo json_encode(['error' => 'yt-dlp not found. Run: pip install yt-dlp']);
    exit;
}

$downloadDir = __DIR__ . '/../downloads';
if (!is_dir($downloadDir)) {
    mkdir($downloadDir, 0777, true);
}

$outputTemplate = $downloadDir . '/%(title)s.%(ext)s';

// Check if ffmpeg is available
$hasFFmpeg = false;
exec('ffmpeg -version 2>&1', $ffOut, $ffCode);
if ($ffCode !== 0) {
    // Check common Windows paths
    $ffmpegPaths = [
        'C:\\ffmpeg\\bin\\ffmpeg.exe',
        'C:\\Program Files\\ffmpeg\\bin\\ffmpeg.exe',
        $downloadDir . '\\ffmpeg.exe',
    ];
    foreach ($ffmpegPaths as $fp) {
        if (file_exists($fp)) { $hasFFmpeg = true; break; }
    }
} else {
    $hasFFmpeg = true;
}

// Get video ID for temp filename
$videoId = 'audio_' . time();
if (preg_match('/[?&]v=([a-zA-Z0-9_-]{11})/', $url, $m)) {
    $videoId = $m[1];
}
$tempFile = $downloadDir . '/' . $videoId;

if ($hasFFmpeg) {
    $cmd = $ytdlp . ' -x --audio-format mp3 --audio-quality 0'
        . ' -o "' . $tempFile . '.%(ext)s"'
        . ' --no-playlist --no-mtime'
        . ' "' . $url . '" 2>&1';
} else {
    $cmd = $ytdlp . ' -f "bestaudio[ext=m4a]/bestaudio"'
        . ' -o "' . $tempFile . '.%(ext)s"'
        . ' --no-playlist --no-mtime'
        . ' "' . $url . '" 2>&1';
}

$output = [];
exec($cmd, $output, $returnCode);

// Find the downloaded file
$files = glob($downloadDir . '/' . $videoId . '.*');
if (empty($files)) {
    $allFiles = glob($downloadDir . '/*.{mp3,m4a,opus,webm,ogg,wav}', GLOB_BRACE);
    if ($allFiles) {
        usort($allFiles, function ($a, $b) { return filemtime($b) - filemtime($a); });
        $files = [reset($allFiles)];
    }
}

if (empty($files)) {
    echo json_encode([
        'error' => 'No audio file created',
        'details' => implode("\n", array_slice($output, -5)),
    ]);
    exit;
}

$file = $files[0];
$ext = pathinfo($file, PATHINFO_EXTENSION);

// Rename file to the actual song title
$title = $input['title'] ?? '';
if (!empty($title)) {
    // Make filename safe: remove special chars
    $safeTitle = preg_replace('/[<>:"\/\\\\|?*]/', '', $title);
    $safeTitle = trim($safeTitle);
    if (!empty($safeTitle)) {
        $newPath = $downloadDir . '/' . $safeTitle . '.' . $ext;
        // Avoid overwriting
        if (file_exists($newPath)) {
            $newPath = $downloadDir . '/' . $safeTitle . '_' . $videoId . '.' . $ext;
        }
        if (rename($file, $newPath)) {
            $file = $newPath;
        }
    }
} else {
    $title = str_replace('_', ' ', pathinfo($file, PATHINFO_FILENAME));
}

$filename = basename($file);

echo json_encode([
    'success' => true,
    'title' => $title,
    'file' => 'downloads/' . $filename,
    'size' => filesize($file),
]);
