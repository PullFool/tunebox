<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once __DIR__ . '/ytdlp.php';

$q = isset($_GET['q']) ? trim($_GET['q']) : '';
if (empty($q)) {
    echo json_encode(['error' => 'No query provided']);
    exit;
}

$ytdlp = findYtDlp();
if (!$ytdlp) {
    echo json_encode(['error' => 'yt-dlp not found. Run: pip install yt-dlp']);
    exit;
}

// Sanitize query - remove shell-dangerous characters
$safeQ = preg_replace('/[^a-zA-Z0-9 \-_]/', '', $q);
$searchQuery = 'ytsearch5:' . $safeQ;
$cmd = $ytdlp . ' "' . $searchQuery . '" --dump-json --flat-playlist --no-download 2>&1';

$output = [];
$returnCode = -1;
exec($cmd, $output, $returnCode);

if (empty($output)) {
    echo json_encode(['results' => []]);
    exit;
}

$results = [];
foreach ($output as $line) {
    $line = trim($line);
    if (empty($line) || $line[0] !== '{') continue;

    $data = json_decode($line, true);
    if (!$data || !isset($data['id'])) continue;

    $duration = isset($data['duration']) ? formatDuration((int)$data['duration']) : '';

    $results[] = [
        'id' => $data['id'],
        'title' => $data['title'] ?? 'Unknown',
        'channel' => $data['channel'] ?? $data['uploader'] ?? 'Unknown',
        'duration' => $duration,
        'thumbnail' => $data['thumbnail'] ?? ($data['thumbnails'][0]['url'] ?? ''),
        'url' => 'https://www.youtube.com/watch?v=' . $data['id'],
    ];
}

echo json_encode(['results' => $results]);

function formatDuration($seconds) {
    $m = floor($seconds / 60);
    $s = $seconds % 60;
    return sprintf('%d:%02d', $m, $s);
}
