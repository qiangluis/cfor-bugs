param([string]$Repo = (Join-Path $PSScriptRoot '..\..'), [int]$Port = 3212)
$ErrorActionPreference = 'Stop'
$node = (Get-Command node -ErrorAction SilentlyContinue).Source
if (-not $node) {
    $node = Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'
}
if (-not (Test-Path -LiteralPath $node)) { throw 'Node.js is required. Install Node.js 22 or later.' }
$repoPath = (Resolve-Path -LiteralPath $Repo).Path
Write-Host "Open http://127.0.0.1:$Port in your browser."
& $node (Join-Path $PSScriptRoot 'bugdesk-server.cjs') --repo $repoPath --port $Port
