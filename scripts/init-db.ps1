$ErrorActionPreference = "Stop"

$databaseName = if ($env:POSTGRES_DB) { $env:POSTGRES_DB } else { "medibook" }
$databaseUser = if ($env:POSTGRES_USER) { $env:POSTGRES_USER } else { "medibook" }

docker compose up -d db

$ready = $false
for ($attempt = 1; $attempt -le 30; $attempt++) {
    docker compose exec -T db pg_isready -U $databaseUser -d $databaseName *> $null
    if ($LASTEXITCODE -eq 0) {
        $ready = $true
        break
    }
    Start-Sleep -Seconds 2
}

if (-not $ready) {
    throw "PostgreSQL did not become ready in time."
}

docker compose run --rm backend python manage.py migrate
docker compose exec -T db psql -U $databaseUser -d $databaseName -c "SELECT current_database(), current_user;"

Write-Output "MediBook database is initialized."

