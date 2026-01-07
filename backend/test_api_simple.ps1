# Simple API Test Script
$baseUrl = "http://localhost:8000"

Write-Host "=== API Test Results ===" -ForegroundColor Cyan

# Test 1: Health
Write-Host "`n1. GET /health" -ForegroundColor Yellow
$health = Invoke-RestMethod -Uri "$baseUrl/health" -Method Get
Write-Host "   Response: $($health | ConvertTo-Json)"

# Test 2: List Vehicles
Write-Host "`n2. GET /api/vehicles" -ForegroundColor Yellow
try {
    $vehicles = Invoke-RestMethod -Uri "$baseUrl/api/vehicles" -Method Get
    Write-Host "   Success: Found $($vehicles.Count) vehicles"
    if ($vehicles.Count -gt 0) {
        Write-Host "   First: $($vehicles[0].vin) - $($vehicles[0].make) $($vehicles[0].model)"
    }
} catch {
    Write-Host "   Error: $_"
}

# Test 3: Create Vehicle
Write-Host "`n3. POST /api/vehicles" -ForegroundColor Yellow
$testVin = "TEST$(Get-Random)"
$body = @{
    vin = $testVin
    make = "Tesla"
    model = "Model 3"
    description = "Electric vehicle"
    image_urls = @("https://example.com/tesla.jpg")
} | ConvertTo-Json

try {
    $created = Invoke-RestMethod -Uri "$baseUrl/api/vehicles" -Method Post -Body $body -ContentType "application/json"
    Write-Host "   Success: Created vehicle $($created.vin)"
} catch {
    Write-Host "   Error: $_"
}

# Test 4: Get by VIN
Write-Host "`n4. GET /api/vehicles/$testVin" -ForegroundColor Yellow
try {
    $vehicle = Invoke-RestMethod -Uri "$baseUrl/api/vehicles/$testVin" -Method Get
    Write-Host "   Success: $($vehicle.make) $($vehicle.model)"
} catch {
    Write-Host "   Error: $_"
}

# Test 5: 404 Test
Write-Host "`n5. GET /api/vehicles/INVALID (should be 404)" -ForegroundColor Yellow
try {
    Invoke-RestMethod -Uri "$baseUrl/api/vehicles/INVALID" -Method Get
    Write-Host "   Unexpected: Should have returned 404"
} catch {
    $status = $_.Exception.Response.StatusCode.value__
    if ($status -eq 404) {
        Write-Host "   Success: Correctly returned 404"
    } else {
        Write-Host "   Error: Returned $status instead of 404"
    }
}

Write-Host "`n=== Tests Complete ===" -ForegroundColor Cyan

