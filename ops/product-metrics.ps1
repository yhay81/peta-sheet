[CmdletBinding()]
param(
    [switch]$Local
)

$ErrorActionPreference = "Stop"
$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$SqlPath = Join-Path $PSScriptRoot "product-metrics.sql"
$Wrangler = Join-Path $RepoRoot "node_modules\.bin\wrangler.cmd"
$Target = if ($Local) { "--local" } else { "--remote" }
$Sql = (Get-Content $SqlPath) -join " "

$Output = & $Wrangler d1 execute peta-sheet $Target --json --command $Sql
if ($LASTEXITCODE -ne 0) {
    throw "D1 metrics query failed with exit code $LASTEXITCODE"
}

$Payload = ($Output -join [Environment]::NewLine) | ConvertFrom-Json
$Row = $Payload[0].results[0]
if (-not $Row) {
    throw "D1 metrics query returned no result"
}

function Get-Percent {
    param(
        [int]$Numerator,
        [int]$Denominator
    )

    if ($Denominator -eq 0) { return 0.0 }
    return [Math]::Round(($Numerator / $Denominator) * 100, 1)
}

$Users = [int]$Row.users
$Edited = [int]$Row.edited
$Adjusted = [int]$Row.adjusted
$Printed = [int]$Row.printed

[ordered]@{
    generated_at = (Get-Date).ToUniversalTime().ToString("o")
    service = "peta-sheet"
    environment = if ($Local) { "local" } else { "production" }
    funnel = [ordered]@{
        users = $Users
        edited = $Edited
        adjusted = $Adjusted
        printed = $Printed
        returned = [int]$Row.returned
        users_7d = [int]$Row.users_7d
        printed_7d = [int]$Row.printed_7d
    }
    rates = [ordered]@{
        edit_percent = Get-Percent $Edited $Users
        adjust_percent = Get-Percent $Adjusted $Edited
        print_percent = Get-Percent $Printed $Users
        return_percent = Get-Percent ([int]$Row.returned) $Users
    }
} | ConvertTo-Json -Depth 4
