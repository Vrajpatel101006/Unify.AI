# =============================================================
#  Unify.AI — Quick Sync Script
#  Commits ALL current changes and pushes them to GitHub.
#
#  Usage (run from the project root):
#    .\scripts\sync.ps1
#    .\scripts\sync.ps1 -Message "feat: my new feature"
#    .\scripts\sync.ps1 -Branch "dev"
# =============================================================

param(
    [string]$Message = "",
    [string]$Branch  = "main"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Write-Step { param($msg) Write-Host "`n🔹 $msg" -ForegroundColor Cyan }
function Write-OK   { param($msg) Write-Host "   ✅ $msg" -ForegroundColor Green }
function Write-Warn { param($msg) Write-Host "   ⚠️  $msg" -ForegroundColor Yellow }

# ── Verify we're in a git repo ────────────────────────────────
if (-not (Test-Path ".git")) {
    Write-Error "❌ Not in a git repository. Run this from the Unify.AI project root."
    exit 1
}

Write-Host ""
Write-Host "  ╔══════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "  ║         Unify.AI — GitHub Sync               ║" -ForegroundColor Cyan
Write-Host "  ╚══════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# ── STEP 1: Show current status ───────────────────────────────
Write-Step "Checking for changes..."
$status = git status --short
if (-not $status) {
    Write-OK "Working tree is clean. Nothing to push."
    Write-Host ""
    exit 0
}

Write-Host ""
Write-Host "  Changed files:" -ForegroundColor White
git status --short | ForEach-Object { Write-Host "    $_" -ForegroundColor Gray }
Write-Host ""

# ── STEP 2: Pull latest from remote first (avoid conflicts) ───
Write-Step "Pulling latest from origin/$Branch..."
try {
    git pull origin $Branch --ff-only 2>&1 | Out-Null
    Write-OK "Up to date with remote."
} catch {
    Write-Warn "Could not fast-forward pull. There may be remote changes. Continuing..."
}

# ── STEP 3: Stage all changes ─────────────────────────────────
Write-Step "Staging all changes..."
git add -A
Write-OK "All changes staged."

# ── STEP 4: Build commit message ──────────────────────────────
if (-not $Message) {
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm"
    # Auto-detect the type of files changed
    $stagedFiles  = git diff --cached --name-only
    $hasNewFiles  = git status --short | Where-Object { $_ -match '^\?\?' }
    $hasModFiles  = git status --short | Where-Object { $_ -match '^M' }
    $hasDelFiles  = git status --short | Where-Object { $_ -match '^D' }

    if ($hasNewFiles -and -not $hasModFiles) {
        $prefix = "feat"
    } elseif ($hasDelFiles -and -not $hasNewFiles) {
        $prefix = "chore"
    } else {
        $prefix = "chore"
    }

    $fileCount = ($stagedFiles | Measure-Object).Count
    $Message = "${prefix}: sync $fileCount file(s) — $timestamp"
}

# ── STEP 5: Commit ────────────────────────────────────────────
Write-Step "Committing: `"$Message`""
git commit -m $Message
Write-OK "Committed."

# ── STEP 6: Push ──────────────────────────────────────────────
Write-Step "Pushing to origin/$Branch..."
git push origin $Branch
Write-OK "Successfully pushed to GitHub!"

Write-Host ""
Write-Host "  ╔══════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "  ║     ✅  All changes pushed to GitHub!        ║" -ForegroundColor Green
Write-Host "  ╚══════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "  View on GitHub:" -ForegroundColor White
Write-Host "  https://github.com/Vrajpatel101006/Unify.AI" -ForegroundColor Blue
Write-Host ""
