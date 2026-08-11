const { spawn } = require('child_process')
const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const virtualEnvironmentPython = process.platform === 'win32'
  ? path.join(root, '.venv', 'Scripts', 'python.exe')
  : path.join(root, '.venv', 'bin', 'python')
const command = process.env.PPE_PYTHON || (fs.existsSync(virtualEnvironmentPython)
  ? virtualEnvironmentPython
  : (process.platform === 'win32' ? 'python' : 'python3'))

const child = spawn(command, process.argv.slice(2), { cwd: root, stdio: 'inherit', windowsHide: false })
child.on('error', (error) => {
  console.error(`Unable to start Python (${command}): ${error.message}`)
  console.error('Run the repository setup script or set PPE_PYTHON to a Python 3.10+ executable.')
  process.exitCode = 1
})
child.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal)
  else process.exitCode = code ?? 1
})
