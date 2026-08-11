const { app, BrowserWindow, session, shell } = require('electron')
const { spawn } = require('child_process')
const fs = require('fs')
const http = require('http')
const net = require('net')
const path = require('path')

let mainWindow
let serverProcess

function projectRoot() {
  return path.resolve(__dirname, '..')
}

function availablePort(preferred) {
  return new Promise((resolve, reject) => {
    const probe = net.createServer()
    probe.unref()
    probe.on('error', () => {
      const fallback = net.createServer()
      fallback.unref()
      fallback.on('error', reject)
      fallback.listen(0, '127.0.0.1', () => {
        const port = fallback.address().port
        fallback.close(() => resolve(port))
      })
    })
    probe.listen(preferred, '127.0.0.1', () => probe.close(() => resolve(preferred)))
  })
}

function waitForServer(port, timeoutMs = 90000) {
  const startedAt = Date.now()
  return new Promise((resolve, reject) => {
    const check = () => {
      const request = http.get({ hostname: '127.0.0.1', port, path: '/healthz', timeout: 1000 }, (response) => {
        response.resume()
        if (response.statusCode === 200) resolve()
        else retry()
      })
      request.on('timeout', () => request.destroy())
      request.on('error', retry)
    }
    const retry = () => {
      if (Date.now() - startedAt >= timeoutMs) reject(new Error('PPE service did not start in time'))
      else setTimeout(check, 350)
    }
    check()
  })
}

function startServer(port) {
  const root = projectRoot()
  const backendDirectory = path.join(process.resourcesPath, 'backend')
  const executableSuffix = process.platform === 'win32' ? '.exe' : ''
  const packagedInference = path.join(backendDirectory, `ppe-inference${executableSuffix}`)
  const packagedDatasetImporter = path.join(backendDirectory, `ppe-dataset-importer${executableSuffix}`)
  if (app.isPackaged && (!fs.existsSync(packagedInference) || !fs.existsSync(packagedDatasetImporter))) {
    throw new Error('Packaged PPE backend executables are missing')
  }
  serverProcess = spawn(process.execPath, [path.join(root, 'server.cjs')], {
    cwd: root,
    windowsHide: true,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: {
      ...process.env,
      ELECTRON_RUN_AS_NODE: '1',
      PPE_PUBLIC: '0',
      PPE_HOST: '127.0.0.1',
      PORT: String(port),
      ...(app.isPackaged ? {
        PPE_INFERENCE_EXECUTABLE: packagedInference,
        PPE_DATASET_IMPORT_EXECUTABLE: packagedDatasetImporter,
      } : {}),
    },
  })
  serverProcess.stdout.on('data', (data) => process.stdout.write(`[ppe] ${data}`))
  serverProcess.stderr.on('data', (data) => process.stderr.write(`[ppe] ${data}`))
  serverProcess.on('exit', (code) => {
    serverProcess = undefined
    if (code && !app.isQuitting) console.error(`PPE service exited with code ${code}`)
  })
}

async function createWindow() {
  const port = await availablePort(Number(process.env.PORT || 4175))
  const appUrl = `http://127.0.0.1:${port}`
  startServer(port)
  await waitForServer(port)

  session.defaultSession.setPermissionCheckHandler((_webContents, permission, requestingOrigin) => (
    permission === 'media' && requestingOrigin.startsWith(appUrl)
  ))
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    callback(permission === 'media' && webContents.getURL().startsWith(appUrl))
  })

  mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 840,
    minHeight: 640,
    backgroundColor: '#101113',
    autoHideMenuBar: true,
    title: 'PPE Sentinel',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//i.test(url)) shell.openExternal(url)
    return { action: 'deny' }
  })
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith(appUrl)) event.preventDefault()
  })
  await mainWindow.loadURL(appUrl)
}

app.whenReady().then(createWindow).catch((error) => {
  console.error(error)
  app.quit()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow().catch(console.error)
})

app.on('before-quit', () => {
  app.isQuitting = true
  if (serverProcess && !serverProcess.killed) serverProcess.kill('SIGTERM')
})
