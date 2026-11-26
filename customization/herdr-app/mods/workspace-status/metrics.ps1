# Herdr resource meter: samples all processes twice, walks the trees rooted at
# herdr-app.exe / herdr-core.exe (covers server, terminals, agents and their
# commands), and prints one compact JSON line.
param([int]$SampleMs = 900)
$ErrorActionPreference = 'SilentlyContinue'
$cores = [int]$env:NUMBER_OF_PROCESSORS
if ($cores -lt 1) { $cores = 1 }

function Snap {
  $map = @{}
  foreach ($p in (Get-CimInstance Win32_Process)) {
    $map[[int]$p.ProcessId] = @{
      Ppid = [int]$p.ParentProcessId
      Name = $p.Name
      Ws   = [int64]$p.WorkingSetSize
      Cpu  = [int64]$p.KernelModeTime + [int64]$p.UserModeTime
    }
  }
  return $map
}

$a = Snap
$t1 = Get-Date
Start-Sleep -Milliseconds $SampleMs
$b = Snap
$t2 = Get-Date
$wall = ($t2 - $t1).TotalSeconds
if ($wall -le 0) { $wall = 1 }

$rootNames = @('herdr-app.exe', 'herdr-core.exe')
$children = @{}
foreach ($kv in $b.GetEnumerator()) {
  $pp = $kv.Value.Ppid
  if (-not $children.ContainsKey($pp)) { $children[$pp] = New-Object System.Collections.ArrayList }
  [void]$children[$pp].Add($kv.Key)
}

$incl = @{}
$stack = New-Object System.Collections.Stack
foreach ($kv in $b.GetEnumerator()) {
  if ($rootNames -contains $kv.Value.Name) { $stack.Push($kv.Key) }
}
while ($stack.Count -gt 0) {
  $id = $stack.Pop()
  if ($incl.ContainsKey($id)) { continue }
  $incl[$id] = $true
  foreach ($c in $children[$id]) { if (-not $incl.ContainsKey($c)) { $stack.Push($c) } }
}

$ram = [int64]0
$cpuTicks = [int64]0
foreach ($id in $incl.Keys) {
  $ram += $b[$id].Ws
  if ($a.ContainsKey($id)) { $cpuTicks += ($b[$id].Cpu - $a[$id].Cpu) }
}
$cpuSec = $cpuTicks / 10000000.0
$cpuPct = [math]::Round(($cpuSec / ($wall * $cores)) * 100.0, 1)
if ($cpuPct -lt 0) { $cpuPct = 0 }
$out = @{
  cpu = $cpuPct
  ramMb = [math]::Round($ram / 1MB, 0)
  procs = $incl.Count
  cores = $cores
} | ConvertTo-Json -Compress
Write-Output $out
