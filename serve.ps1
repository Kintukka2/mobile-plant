# Minimal static file server for local testing.
# No Node/Python on this machine, so this uses raw TcpListener (needs no elevation).
$ErrorActionPreference = 'Stop'

$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$port = 8787

$types = @{
  '.html'        = 'text/html; charset=utf-8'
  '.css'         = 'text/css; charset=utf-8'
  '.js'          = 'application/javascript; charset=utf-8'
  '.webmanifest' = 'application/manifest+json'
  '.json'        = 'application/json; charset=utf-8'
  '.svg'         = 'image/svg+xml'
  '.png'         = 'image/png'
  '.jpg'         = 'image/jpeg'
  '.jpeg'        = 'image/jpeg'
  '.ico'         = 'image/x-icon'
}

$listener = New-Object System.Net.Sockets.TcpListener([System.Net.IPAddress]::Loopback, $port)
$listener.Start()
Write-Host ("Serving {0} on http://localhost:{1}/" -f $root, $port)

function Send-Response {
  param($Stream, [int]$Status, [string]$Reason, [string]$ContentType, [byte[]]$Body)
  $head = "HTTP/1.1 $Status $Reason`r`n"
  $head += "Content-Type: $ContentType`r`n"
  $head += "Content-Length: $($Body.Length)`r`n"
  $head += "Cache-Control: no-store`r`n"
  $head += "Connection: close`r`n`r`n"
  $hb = [System.Text.Encoding]::ASCII.GetBytes($head)
  $Stream.Write($hb, 0, $hb.Length)
  if ($Body.Length) { $Stream.Write($Body, 0, $Body.Length) }
  $Stream.Flush()
}

while ($true) {
  $client = $null
  try {
    $client = $listener.AcceptTcpClient()
    $stream = $client.GetStream()
    $stream.ReadTimeout = 5000
    $reader = New-Object System.IO.StreamReader($stream, [System.Text.Encoding]::ASCII)

    $requestLine = $reader.ReadLine()
    if ([string]::IsNullOrWhiteSpace($requestLine)) { $client.Close(); continue }
    while ($true) { $h = $reader.ReadLine(); if ([string]::IsNullOrEmpty($h)) { break } }

    $bits = $requestLine -split ' '
    $target = $bits[1]
    if ($target -match '^(.*?)\?') { $target = $matches[1] }
    $target = [System.Uri]::UnescapeDataString($target)
    if ($target -eq '/' -or $target -eq '') { $target = '/index.html' }

    $rel = $target.TrimStart('/').Replace('/', '\')
    $full = [System.IO.Path]::GetFullPath((Join-Path $root $rel))

    if (-not $full.StartsWith($root, [System.StringComparison]::OrdinalIgnoreCase)) {
      Send-Response $stream 403 'Forbidden' 'text/plain' ([System.Text.Encoding]::UTF8.GetBytes('Forbidden'))
    } elseif (Test-Path -LiteralPath $full -PathType Leaf) {
      $ext = [System.IO.Path]::GetExtension($full).ToLower()
      $ct = $types[$ext]
      if (-not $ct) { $ct = 'application/octet-stream' }
      $bytes = [System.IO.File]::ReadAllBytes($full)
      Send-Response $stream 200 'OK' $ct $bytes
      Write-Host ("200 {0}" -f $target)
    } else {
      Send-Response $stream 404 'Not Found' 'text/plain' ([System.Text.Encoding]::UTF8.GetBytes('Not found: ' + $target))
      Write-Host ("404 {0}" -f $target)
    }
  } catch {
    Write-Host ("ERR {0}" -f $_.Exception.Message)
  } finally {
    if ($client) { try { $client.Close() } catch {} }
  }
}
