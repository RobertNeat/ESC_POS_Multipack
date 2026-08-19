<#
Tworzy puste pliki .md z listy nazw w pliku tekstowym.

Uzycie:
  .\create_markdown_files.ps1 .\filenames.txt
  .\create_markdown_files.ps1 .\filenames.txt .\output

Parametry:
  1. InputFile       - plik z nazwami, jedna nazwa w kazdej linii
  2. OutputDirectory - opcjonalny katalog wyjsciowy, domyslnie biezacy katalog

Format nazw:
  "Horizontal Tab" -> "1_horizontal_tab.md"
  "Print QR-CODE" -> "2_print_qr-code.md"

Zasady:
  - puste linie sa pomijane
  - spacje sa zamieniane na _
  - wielkie litery sa zamieniane na male
  - niedozwolone znaki w nazwach plikow sa zamieniane na -
  - istniejace pliki nie sa nadpisywane
#>

param(
    [Parameter(Mandatory = $true, Position = 0)]
    [ValidateScript({ Test-Path -LiteralPath $_ -PathType Leaf })]
    [string]$InputFile,

    [Parameter(Position = 1)]
    [string]$OutputDirectory = "."
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path -LiteralPath $OutputDirectory -PathType Container)) {
    New-Item -ItemType Directory -Path $OutputDirectory | Out-Null
}

function Convert-ToSafeFileName {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Name
    )

    $safeName = $Name.Trim().ToLowerInvariant()
    $safeName = $safeName -replace '\s+', '_'
    $safeName = $safeName -replace '[<>:"/\\|?*#%&{}$!''@+`=]', '-'
    $safeName = $safeName -replace '-+', '-'
    $safeName = $safeName -replace '_+', '_'
    $safeName = $safeName.Trim(' ', '.', '-', '_')

    return $safeName
}

$itemNumber = 0

Get-Content -LiteralPath $InputFile | ForEach-Object {
    $line = $_.Trim()

    if ([string]::IsNullOrWhiteSpace($line)) {
        return
    }

    $itemNumber++

    $baseName = Convert-ToSafeFileName -Name $line

    if ([string]::IsNullOrWhiteSpace($baseName)) {
        Write-Warning "Pominieto linie, bo po oczyszczeniu nazwa jest pusta: '$line'"
        return
    }

    $fileName = "$($itemNumber)_$baseName.md"
    $targetPath = Join-Path -Path $OutputDirectory -ChildPath $fileName

    if (Test-Path -LiteralPath $targetPath) {
        Write-Warning "Plik juz istnieje, pomijam: $targetPath"
        return
    }

    New-Item -ItemType File -Path $targetPath | Out-Null
    Write-Host "Utworzono: $targetPath"
}
