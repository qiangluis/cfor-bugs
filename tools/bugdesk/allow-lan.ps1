#Requires -RunAsAdministrator
param([Parameter(Mandatory=$true)][string]$Address, [int]$Port = 3212)
$ErrorActionPreference = 'Stop'
if ($Port -lt 1 -or $Port -gt 65535) { throw 'Invalid port.' }
$localAddresses = [System.Net.NetworkInformation.NetworkInterface]::GetAllNetworkInterfaces() | ForEach-Object { $_.GetIPProperties().UnicastAddresses } | ForEach-Object { $_.Address.IPAddressToString }
if ($Address -notin $localAddresses -or $Address -notmatch '^(10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.)') { throw 'Use a private IPv4 address assigned to this computer.' }
$node = (Get-Command node -ErrorAction SilentlyContinue).Source
if (-not $node) { $node = Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' }
if (-not (Test-Path -LiteralPath $node)) { throw 'Node.js was not found.' }
$ruleName = 'CFOR-BugDesk-LAN-' + $Port + '-' + $Address.Replace('.','-')
$existing = Get-NetFirewallRule -Name $ruleName -ErrorAction SilentlyContinue
if (-not $existing) {
    New-NetFirewallRule -Name $ruleName -DisplayName "CFOR BugDesk LAN $Address`:$Port" -Direction Inbound -Action Allow -Protocol TCP -LocalAddress $Address -LocalPort $Port -RemoteAddress LocalSubnet -Program $node -Profile Any | Out-Null
}
Write-Host "Allowed local subnet access to http://$Address`:$Port/"
