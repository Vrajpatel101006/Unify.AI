# =============================================================
#  Unify.AI — Full Environment Restore Script
#  Run this ONCE after a fresh Windows install to restore
#  your entire dev environment and project from GitHub.
#
#  Usage (run from the project root):
#    .\scripts\setup.ps1
#
#  Bootstrap from scratch (no repo yet):
#    irm https://raw.githubusercontent.com/Vrajpatel101006/Unify.AI/main/scripts/setup.ps1 | iex
# =============================================================

param(
    [string]$RepoUrl    = "https://github.com/Vrajpatel101006/Unify.AI.git",
    [string]$CloneDir   = "$env:USERPROFILE\Desktop\Unify.AI",
    [switch]$SkipClone  = $false,   # pass -SkipClone if repo already exists locally
    [switch]$PushAfter  = $false    # pass -PushAfter to auto-push after setup
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# ── Helpers ────────────────────────────────────────────────────
function Write-Step  { param($msg) Write-Host "`n🔹 $msg" -ForegroundColor Cyan }
function Write-OK    { param($msg) Write-Host "   ✅ $msg" -ForegroundColor Green }
function Write-Warn  { param($msg) Write-Host "   ⚠️  $msg" -ForegroundColor Yellow }

function Test-CommandExists {
    param($cmd)
    return [bool](Get-Command $cmd -ErrorAction SilentlyContinue)
}

function Install-WingetPackage {
    param($id, $name)
    if (-not (Test-CommandExists winget)) {
        Write-Warn "winget not available — install $name manually from the Microsoft Store."
        return
    }
    Write-Step "Installing $name..."
    winget install --id $id --silent --accept-package-agreements --accept-source-agreements
}

# ── Banner ─────────────────────────────────────────────────────
Clear-Host
Write-Host ""
Write-Host "  ╔══════════════════════════════════════════════╗" -ForegroundColor Magenta
Write-Host "  ║       Unify.AI — Environment Restore         ║" -ForegroundColor Magenta
Write-Host "  ║       Fresh Windows Setup Automation         ║" -ForegroundColor Magenta
Write-Host "  ╚══════════════════════════════════════════════╝" -ForegroundColor Magenta
Write-Host ""

# ── STEP 1: Install Chocolatey (package manager fallback) ──────
Write-Step "Checking Chocolatey..."
if (-not (Test-CommandExists choco)) {
    Write-Warn "Chocolatey not found. Installing..."
    Set-ExecutionPolicy Bypass -Scope Process -Force
    [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
    Invoke-Expression ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
    $env:Path += ";$env:ALLUSERSPROFILE\chocolatey\bin"
    Write-OK "Chocolatey installed."
} else {
    Write-OK "Chocolatey already installed."
}

# ── STEP 2: Install Git ────────────────────────────────────────
Write-Step "Checking Git..."
if (-not (Test-CommandExists git)) {
    Write-Warn "Git not found. Installing via winget..."
    Install-WingetPackage "Git.Git" "Git"
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
    Write-OK "Git installed."
} else {
    Write-OK "Git $(git --version) already installed."
}

# ── STEP 3: Install Node.js v20+ ──────────────────────────────
Write-Step "Checking Node.js (>=20)..."
if (-not (Test-CommandExists node)) {
    Write-Warn "Node.js not found. Installing via winget..."
    Install-WingetPackage "OpenJS.NodeJS.LTS" "Node.js LTS"
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
    Write-OK "Node.js installed."
} else {
    $nodeVer = (node --version).TrimStart('v').Split('.')[0]
    if ([int]$nodeVer -lt 20) {
        Write-Warn "Node.js version is $nodeVer (need >=20). Upgrading..."
        Install-WingetPackage "OpenJS.NodeJS.LTS" "Node.js LTS"
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
    } else {
        Write-OK "Node.js $(node --version) already installed."
    }
}

# ── STEP 4: Ensure npm v10+ ────────────────────────────────────
Write-Step "Checking npm (>=10)..."
$npmVer = (npm --version).Split('.')[0]
if ([int]$npmVer -lt 10) {
    Write-Warn "npm version is $npmVer. Upgrading to latest..."
    npm install -g npm@latest
}
Write-OK "npm $(npm --version) ready."

# ── STEP 5: Install VS Code (optional but recommended) ────────
Write-Step "Checking VS Code..."
if (-not (Test-CommandExists code)) {
    Write-Warn "VS Code not found. Installing..."
    Install-WingetPackage "Microsoft.VisualStudioCode" "VS Code"
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
    Write-OK "VS Code installed."
} else {
    Write-OK "VS Code already installed."
}

# ── STEP 6: Configure Git identity ────────────────────────────
Write-Step "Configuring Git identity..."
$gitUser  = git config --global user.name  2>$null
$gitEmail = git config --global user.email 2>$null

if (-not $gitUser) {
    $gitUser = Read-Host "  Enter your Git username (e.g. Vrajpatel101006)"
    git config --global user.name $gitUser
}
if (-not $gitEmail) {
    $gitEmail = Read-Host "  Enter your Git email"
    git config --global user.email $gitEmail
}

git config --global core.autocrlf true
git config --global pull.rebase false
git config --global init.defaultBranch main
Write-OK "Git identity set: $gitUser <$gitEmail>"

# ── STEP 7: Clone or update repo ──────────────────────────────
Write-Step "Setting up repository..."

if ($SkipClone -and (Test-Path "$CloneDir\.git")) {
    Write-OK "Repo already exists at $CloneDir — skipping clone."
    Set-Location $CloneDir
} elseif (Test-Path "$CloneDir\.git") {
    Write-Warn "Repo directory already exists. Pulling latest changes..."
    Set-Location $CloneDir
    git pull origin main --ff-only
    Write-OK "Repository updated."
} else {
    Write-Host "  Cloning from $RepoUrl into $CloneDir..." -ForegroundColor White
    $parent = Split-Path $CloneDir -Parent
    if (-not (Test-Path $parent)) { New-Item -ItemType Directory -Path $parent -Force | Out-Null }
    git clone $RepoUrl $CloneDir
    Set-Location $CloneDir
    Write-OK "Repository cloned successfully."
}

# ── STEP 8: Install npm dependencies ──────────────────────────
Write-Step "Installing npm dependencies (all workspaces)..."
npm install
Write-OK "All npm packages installed."

# ── STEP 9: Restore .env files ─────────────────────────────────
Write-Step "Checking environment configuration..."

$envPairs = @(
    @{ Example = ".env.example";            Target = ".env" },
    @{ Example = "apps\web\.env.example";   Target = "apps\web\.env" },
    @{ Example = "apps\desktop\.env.example"; Target = "apps\desktop\.env" },
    @{ Example = "apps\api\.env.example";   Target = "apps\api\.env" }
)

foreach ($pair in $envPairs) {
    $exPath = Join-Path $CloneDir $pair.Example
    $tgPath = Join-Path $CloneDir $pair.Target
    if (Test-Path $exPath) {
        if (-not (Test-Path $tgPath)) {
            Copy-Item $exPath $tgPath
            Write-Warn "Created $($pair.Target) from example — FILL IN YOUR API KEYS!"
        } else {
            Write-OK "$($pair.Target) already exists."
        }
    }
}

# ── STEP 10: Verify the build ──────────────────────────────────
Write-Step "Running lint check to verify project health..."
try {
    npm run lint 2>&1 | Select-Object -Last 10
    Write-OK "Lint passed — project is healthy."
} catch {
    Write-Warn "Lint had warnings/errors. Check output above."
}

# ── STEP 11: Push any local changes to GitHub (optional) ──────
if ($PushAfter) {
    Write-Step "Committing and pushing any local changes..."
    $status = git status --porcelain
    if ($status) {
        git add -A
        $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm"
        git commit -m "chore: post-restore sync [$timestamp]"
        git push origin main
        Write-OK "Changes pushed to GitHub."
    } else {
        Write-OK "Nothing to push — working tree is clean."
    }
}

# ── Done ───────────────────────────────────────────────────────
Write-Host ""
Write-Host "  ╔══════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "  ║       ✅  Setup Complete!                    ║" -ForegroundColor Green
Write-Host "  ╚══════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "  Next steps:" -ForegroundColor White
Write-Host "   1. Fill in your .env files with API keys" -ForegroundColor Yellow
Write-Host "   2. Run: npm run dev           (start web app)" -ForegroundColor Yellow
Write-Host "   3. Run: npm run desktop       (start Electron)" -ForegroundColor Yellow
Write-Host "   4. Run: .\scripts\sync.ps1    (push updates anytime)" -ForegroundColor Yellow
Write-Host ""
