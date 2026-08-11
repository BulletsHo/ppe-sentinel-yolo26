param(
  [string]$Python = $env:PPE_BOOTSTRAP_PYTHON,
  [switch]$BuildTools
)

$ErrorActionPreference = 'Stop'
$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
Set-Location $ProjectRoot

if (-not (Get-Command node -ErrorAction SilentlyContinue)) { throw 'Node.js 20 or newer is required.' }
if (-not (Get-Command npm.cmd -ErrorAction SilentlyContinue)) { throw 'npm is required.' }

if ($Python) {
  $PythonCommand = @($Python)
} elseif (Get-Command py -ErrorAction SilentlyContinue) {
  $PythonCommand = @('py', '-3')
} elseif (Get-Command python3 -ErrorAction SilentlyContinue) {
  $PythonCommand = @('python3')
} elseif (Get-Command python -ErrorAction SilentlyContinue) {
  $PythonCommand = @('python')
} else {
  throw 'Python 3.10 or newer is required. Set PPE_BOOTSTRAP_PYTHON to its executable path.'
}
$PythonExecutable = $PythonCommand[0]
$PythonArguments = if ($PythonCommand.Count -gt 1) { @($PythonCommand[1..($PythonCommand.Count - 1)]) } else { @() }

if (-not (Test-Path '.venv\Scripts\python.exe')) {
  & $PythonExecutable @PythonArguments -m venv .venv
}
$VenvPython = (Resolve-Path '.venv\Scripts\python.exe').Path
& $VenvPython -m pip install --upgrade pip
if ($env:PPE_TORCH_INDEX_URL) {
  & $VenvPython -m pip install torch torchvision --index-url $env:PPE_TORCH_INDEX_URL
}
& $VenvPython -m pip install -r $(if ($BuildTools) { 'requirements-build.txt' } else { 'requirements.txt' })
& npm.cmd install

Write-Host ''
Write-Host 'Setup complete.'
Write-Host 'Web mode:     npm start'
Write-Host 'Desktop mode: npm run desktop'
Write-Host 'Dataset CLI:  npm run dataset:import -- --source <dataset.zip> --name <name>'
