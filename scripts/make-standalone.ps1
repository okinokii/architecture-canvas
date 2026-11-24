# Builds the offline archive: index.html + core.js + presets.js + START.txt + LICENSE.
# Run: powershell -ExecutionPolicy Bypass -File scripts/make-standalone.ps1
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$version = 'local'
try { $version = (git -C $root describe --tags --abbrev=0).Trim() } catch { }
$stage = Join-Path ([System.IO.Path]::GetTempPath()) ('archcanvas-standalone-' + [guid]::NewGuid().ToString('N'))
$dist = Join-Path $root 'dist'
New-Item -ItemType Directory -Force -Path $stage, $dist | Out-Null
try {
    foreach ($name in 'index.html', 'core.js', 'presets.js') {
        Copy-Item (Join-Path $root "architecture-canvas/$name") $stage
    }
    Copy-Item (Join-Path $root 'LICENSE') $stage
    Copy-Item (Join-Path $root 'standalone/START.txt') $stage
    $target = Join-Path $dist "ArchitectureCanvas-standalone-$version.zip"
    if (Test-Path $target) { Remove-Item $target -Force }
    Compress-Archive -Path (Join-Path $stage '*') -DestinationPath $target -CompressionLevel Optimal
    Write-Host "Done: $target"
} finally {
    Remove-Item -Recurse -Force $stage
}
