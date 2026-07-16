$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$exportRoot = Join-Path $env:TEMP 'repomix-safe-export'
$outputName = 'repomix-output.xml'

if (Test-Path $exportRoot) {
    Remove-Item -LiteralPath $exportRoot -Recurse -Force
}

New-Item -ItemType Directory -Path $exportRoot | Out-Null

Push-Location $repoRoot
try {
    $trackedFiles = git ls-files
    $untrackedFiles = git ls-files --others --exclude-standard
    $filesToCopy = @($trackedFiles + $untrackedFiles | Sort-Object -Unique)

    foreach ($file in $filesToCopy) {
        if ([string]::IsNullOrWhiteSpace($file)) {
            continue
        }

        $sourcePath = Join-Path $repoRoot $file
        if (-not (Test-Path -LiteralPath $sourcePath -PathType Leaf)) {
            continue
        }

        $destinationPath = Join-Path $exportRoot $file
        $destinationDir = Split-Path -Parent $destinationPath

        if (-not (Test-Path -LiteralPath $destinationDir)) {
            New-Item -ItemType Directory -Path $destinationDir -Force | Out-Null
        }

        Copy-Item -LiteralPath $sourcePath -Destination $destinationPath -Force
    }
}
finally {
    Pop-Location
}

Push-Location $exportRoot
try {
    npx repomix --output $outputName --quiet
    Copy-Item -LiteralPath (Join-Path $exportRoot $outputName) -Destination (Join-Path $repoRoot $outputName) -Force

    $packedCount = (Get-Content $outputName | Select-String -Pattern '<file path="').Count
    Write-Output "Repomix generado en: $(Join-Path $repoRoot $outputName)"
    Write-Output "Archivos empaquetados: $packedCount"
}
finally {
    Pop-Location
}
