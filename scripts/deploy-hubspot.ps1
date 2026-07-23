<#
.SYNOPSIS
    Faz validate + upload + deploy do projeto HubSpot Custom Workflow Action.
#>
[CmdletBinding()]
param(
    [string]$ProjectDir = ".\Alper HS APIs"
)

$ErrorActionPreference = "Stop"

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "  HubSpot Project - Validate + Upload + Deploy" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "Project dir: $ProjectDir"
Write-Host ""

if (-not (Test-Path $ProjectDir)) { Write-Error "Diretório não encontrado: $ProjectDir" }
if (-not (Get-Command hs -ErrorAction SilentlyContinue)) { Write-Error "HubSpot CLI (hs) não instalado." }

Push-Location $ProjectDir
try {
    Write-Host "[1/3] hs project validate" -ForegroundColor Yellow
    hs project validate
    if ($LASTEXITCODE -ne 0) { throw "validate falhou (exit $LASTEXITCODE)" }
    Write-Host "validate OK" -ForegroundColor Green
    Write-Host ""

    Write-Host "[2/3] hs project upload" -ForegroundColor Yellow
    hs project upload
    if ($LASTEXITCODE -ne 0) { throw "upload falhou (exit $LASTEXITCODE)" }
    Write-Host "upload OK" -ForegroundColor Green
    Write-Host ""

    Write-Host "[3/3] hs project list-builds (últimos 5)" -ForegroundColor Yellow
    hs project list-builds --limit 5
    if ($LASTEXITCODE -ne 0) { throw "list-builds falhou" }
    Write-Host ""
    $buildId = Read-Host "Digite o ID do build recém-criado para fazer deploy"
    if ([string]::IsNullOrWhiteSpace($buildId)) {
        Write-Warning "Deploy pulado (nenhum build selecionado)."
    } else {
        hs project deploy $buildId
        if ($LASTEXITCODE -ne 0) { throw "deploy falhou (exit $LASTEXITCODE)" }
        Write-Host "Deploy do build $buildId concluído." -ForegroundColor Green
    }
}
finally {
    Pop-Location
}

Write-Host ""
Write-Host "Próximo passo: abra um workflow no HubSpot e adicione a ação" -ForegroundColor Cyan
Write-Host "'Normalize Phone Number' (Alper API Engine)." -ForegroundColor Cyan
