$ErrorActionPreference = "Stop"

$script:failed = $false

function Pass($message) {
    Write-Host "[PASS] $message" -ForegroundColor Green
}

function Fail($message) {
    Write-Host "[FAIL] $message" -ForegroundColor Red
    $script:failed = $true
}

function Test-Http($name, $url) {
    try {
        $response = Invoke-WebRequest `
            -Uri $url `
            -UseBasicParsing `
            -TimeoutSec 10

        if ($response.StatusCode -eq 200) {
            Pass "$name returned HTTP 200"
        }
        else {
            Fail "$name returned HTTP $($response.StatusCode)"
        }
    }
    catch {
        Fail "$name is not reachable"
    }
}

function Test-Service($service) {

    $ids = @(docker compose ps -q $service)

    if ($ids.Count -eq 0) {
        Fail "$service has no running container"
        return
    }

    foreach ($id in $ids) {

        $state = docker inspect `
            -f '{{.State.Status}}' `
            $id

        if ($state -eq "running") {
            Pass "$service container is running"
        }
        else {
            Fail "$service container state = $state"
        }

        $health = docker inspect `
            -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' `
            $id

        if ($health -eq "healthy") {
            Pass "$service health = healthy"
        }
        elseif ($health -eq "none") {
            Pass "$service has no Docker healthcheck"
        }
        else {
            Fail "$service health = $health"
        }
    }
}

function Test-PrivateService($service) {

    $ids = @(docker compose ps -q $service)

    foreach ($id in $ids) {

        $published = docker port $id

        if ([string]::IsNullOrWhiteSpace($published)) {
            Pass "$service has no published host ports"
        }
        else {
            Fail "$service unexpectedly publishes: $published"
        }
    }
}

Write-Host ""
Write-Host "======================================"
Write-Host "      TriageDesk Local Validation"
Write-Host "======================================"
Write-Host ""

Write-Host "1. Container Status"
Test-Service "portal"
Test-Service "core-api"
Test-Service "status"
Test-Service "postgres"
Test-Service "nginx"

Write-Host ""
Write-Host "2. HTTP Tests"

Test-Http "Portal" `
    "http://localhost:8080/"

Test-Http "Core API Health" `
    "http://localhost:8080/api/core-health"

Test-Http "Tickets API" `
    "http://localhost:8080/api/tickets"

Test-Http "Assets API" `
    "http://localhost:8080/api/assets"

Test-Http "Status Service" `
    "http://localhost:8080/api/status"

Write-Host ""
Write-Host "3. Network Exposure"

Test-PrivateService "portal"
Test-PrivateService "core-api"
Test-PrivateService "status"
Test-PrivateService "postgres"

$nginxId = docker compose ps -q nginx
$nginxPorts = docker port $nginxId

if ($nginxPorts -match "8080") {
    Pass "Nginx is the public entry point on port 8080"
}
else {
    Fail "Nginx port 8080 is not published"
}

Write-Host ""
Write-Host "4. Non-root Containers"

foreach ($service in @("portal", "core-api", "status")) {

    $ids = @(docker compose ps -q $service)

    foreach ($id in $ids) {

        $user = docker inspect `
            -f '{{.Config.User}}' `
            $id

        if ($user -eq "appuser") {
            Pass "$service runs as appuser"
        }
        else {
            Fail "$service user = '$user'"
        }
    }
}

Write-Host ""
Write-Host "5. Nginx Security Headers"

try {

    $response = Invoke-WebRequest `
        -Uri "http://localhost:8080/" `
        -UseBasicParsing

    if ($response.Headers["X-Content-Type-Options"] -eq "nosniff") {
        Pass "X-Content-Type-Options = nosniff"
    }
    else {
        Fail "X-Content-Type-Options missing"
    }

    if ($response.Headers["X-Frame-Options"] -eq "DENY") {
        Pass "X-Frame-Options = DENY"
    }
    else {
        Fail "X-Frame-Options missing"
    }

    if (
        $response.Headers["Referrer-Policy"] `
        -eq "strict-origin-when-cross-origin"
    ) {
        Pass "Referrer-Policy configured"
    }
    else {
        Fail "Referrer-Policy missing"
    }

}
catch {
    Fail "Could not test Nginx security headers"
}

Write-Host ""
Write-Host "======================================"

if ($script:failed) {

    Write-Host "SOME CHECKS FAILED" `
        -ForegroundColor Red

    Write-Host "======================================"

    exit 1
}
else {

    Write-Host "ALL CHECKS PASSED" `
        -ForegroundColor Green

    Write-Host "LOCAL ENVIRONMENT READY" `
        -ForegroundColor Green

    Write-Host "======================================"

    exit 0
}