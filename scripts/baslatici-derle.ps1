# TürkUI tek dosya başlatıcısını (runtime/baslatici/baslatici.exe) derler.
#
# Kullanım:  npm run baslatici
# Gereken:   .NET Framework 4.x (Windows 10/11 ile birlikte gelir) ve Node.js
#
# Başlatıcı kaynağı değiştiğinde bu betik yeniden çalıştırılmalıdır.

$ErrorActionPreference = 'Stop'

$kok = Split-Path -Parent $PSScriptRoot
$klasor = Join-Path $kok 'runtime\baslatici'
$kaynak = Join-Path $klasor 'baslatici.cs'
$cikti = Join-Path $klasor 'baslatici.exe'
$ikon = Join-Path $klasor 'ikon.ico'

if (-not (Test-Path $kaynak)) {
    throw "Başlatıcı kaynağı bulunamadı: $kaynak"
}

$csc = @(
    (Join-Path $env:WINDIR 'Microsoft.NET\Framework64\v4.0.30319\csc.exe'),
    (Join-Path $env:WINDIR 'Microsoft.NET\Framework\v4.0.30319\csc.exe')
) | Where-Object { Test-Path $_ } | Select-Object -First 1

if (-not $csc) {
    throw '.NET Framework derleyicisi (csc.exe) bulunamadı. Windows 10/11 üzerinde çalıştırın.'
}

# Simge, paketleyicinin ürettiği simgeyle aynı olsun.
if (-not (Test-Path $ikon)) {
    $derlenmis = Join-Path $kok 'out\uygulamaPaketleyici.js'
    if (-not (Test-Path $derlenmis)) {
        Write-Host 'TypeScript derleniyor...'
        Push-Location $kok
        try {
            & npx tsc -p ./
        }
        finally {
            Pop-Location
        }
    }

    & node -e "require('./out/uygulamaPaketleyici').simgeYaz(process.argv[1])" $ikon
    if ($LASTEXITCODE -ne 0) {
        throw 'Simge üretilemedi.'
    }
}

Write-Host 'Başlatıcı derleniyor...'
& $csc /nologo /codepage:65001 /target:winexe /platform:anycpu /optimize+ `
    /r:System.IO.Compression.dll "/win32icon:$ikon" "/out:$cikti" $kaynak

if ($LASTEXITCODE -ne 0) {
    throw "Derleme başarısız (kod $LASTEXITCODE)."
}

$boyut = [math]::Round((Get-Item $cikti).Length / 1KB, 1)
Write-Host "Hazır: $cikti ($boyut KB)"
