<#
.SYNOPSIS
    Faz stage + commit das mudanças do Phone Normalizer no backend.

.DESCRIPTION
    Adiciona APENAS os arquivos novos/alterados do Phone Normalizer:
      - backend/src/services/phone-normalizer.ts
      - backend/src/services/phone-normalizer.test.ts
      - backend/src/routes/phone-normalizer-action.ts
      - backend/src/server.ts
    e cria um commit com mensagem padronizada.
    NÃO faz push (você decide quando enviar pro remote).

.PARAMETER Message
    Mensagem de commit. Padrão: "feat(backend): add phone normalizer workflow action"

.EXAMPLE
    .\scripts\commit-backend.ps1
    .\scripts\commit-backend.ps1 -Message "feat: normaliza telefone no workflow"
#>
[CmdletBinding()]
param(
    [string]$Message = "feat(backend): add phone normalizer workflow action"
)

$ErrorActionPreference = "Stop"

$files = @(
    "backend/src/services/phone-normalizer.ts"
    "backend/src/services/phone-normalizer.test.ts"
    "backend/src/routes/phone-normalizer-action.ts"
    "backend/src/server.ts"
)

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "  Phone Normalizer - Commit do backend" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

# 1) checa se os arquivos existem
foreach ($f in $files) {
    if (-not (Test-Path $f)) {
        Write-Error "Arquivo não encontrado: $f"
    }
}

# 2) status do git
Write-Host ""
Write-Host "Status atual:" -ForegroundColor Yellow
git status --short
Write-Host ""

# 3) git add dos arquivos
Write-Host "Adicionando arquivos..." -ForegroundColor Yellow
foreach ($f in $files) {
    git add $f
    Write-Host "  + $f" -ForegroundColor Green
}
Write-Host ""

# 4) mostra o que vai entrar no commit
Write-Host "Diff staged:" -ForegroundColor Yellow
git diff --cached --stat
Write-Host ""

# 5) pede confirmação
$confirm = Read-Host "Confirmar commit com a mensagem `"$Message`"? (s/N)"
if ($confirm -notin @("s", "S", "y", "Y", "sim")) {
    Write-Warning "Commit cancelado. Arquivos já estão staged."
    Write-Host "Para desfazer o stage: git reset HEAD"
    exit 0
}

# 6) commit
git commit -m $Message
if ($LASTEXITCODE -ne 0) {
    throw "git commit falhou (exit $LASTEXITCODE)"
}

Write-Host ""
Write-Host "Commit criado." -ForegroundColor Green
Write-Host ""
Write-Host "Próximo passo: faça push para o remote para o Render pegar as mudanças:" -ForegroundColor Cyan
Write-Host "  git push origin <branch>" -ForegroundColor Cyan
