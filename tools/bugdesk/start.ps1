param([string]$Repo = '', [int]$Port = 3212, [string]$Address = '')
$ErrorActionPreference = 'Stop'
$node = (Get-Command node -ErrorAction SilentlyContinue).Source
if (-not $node) {
    $node = Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'
}
if (-not (Test-Path -LiteralPath $node)) { throw 'Node.js is required. Install Node.js 22 or later.' }
if (-not $Repo) {
    $installedRepo = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..\..'))
    if (Test-Path -LiteralPath (Join-Path $installedRepo '.git')) { $Repo = $installedRepo }
    else { $Repo = Join-Path $PSScriptRoot '..\cfor-bugs' }
}
$repoPath = (Resolve-Path -LiteralPath $Repo).Path
$current = $null
try { $current = Invoke-RestMethod -Uri "http://127.0.0.1:$Port/api/status" -TimeoutSec 3 } catch {}
if ($current -and $current.repo -ne $repoPath) { throw 'This port is already serving another repository.' }
$gatewayArgs = @((Join-Path $PSScriptRoot 'lan-access.cjs'), '--port', $Port)
if ($Address) { $gatewayArgs += @('--address', $Address) }
if (-not $current) { $gatewayArgs += @('--start-backend', '--repo', $repoPath) }
& $node @gatewayArgs
