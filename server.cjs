const http = require('http')
const https = require('https')
const crypto = require('crypto')
const fs = require('fs')
const path = require('path')
const { spawn } = require('child_process')

const root = __dirname
const port = Number(process.env.PORT || 4175)
const publicMode = /^(1|true|yes)$/i.test(process.env.PPE_PUBLIC || '')
const host = process.env.PPE_HOST || (publicMode ? '0.0.0.0' : '127.0.0.1')
const inferencePort = Number(process.env.PPE_INFERENCE_PORT || 4176)
const logsDirectory = process.env.PPE_LOG_DIR ? path.resolve(process.env.PPE_LOG_DIR) : path.join(root, 'logs')
const datasetsDirectory = process.env.PPE_DATASETS_DIR ? path.resolve(process.env.PPE_DATASETS_DIR) : path.join(root, 'datasets')
const maxDatasetUploadBytes = Number(process.env.PPE_MAX_DATASET_UPLOAD_MB || 2048) * 1024 * 1024
const accessUsername = process.env.PPE_USERNAME || ''
const accessPassword = process.env.PPE_PASSWORD || ''
const allowInsecurePublic = /^(1|true|yes)$/i.test(process.env.PPE_ALLOW_INSECURE_PUBLIC || '')
const tlsCertificatePath = process.env.PPE_TLS_CERT ? path.resolve(process.env.PPE_TLS_CERT) : ''
const tlsKeyPath = process.env.PPE_TLS_KEY ? path.resolve(process.env.PPE_TLS_KEY) : ''
const packagedModelPath = path.join(root, 'models', 'ppe-yolo26n.pt')
const finalIncrementalModelPath = path.join(root, 'outputs', 'yolo26-train', 'ppe-yolo26n-incremental-final', 'weights', 'best.pt')
const incrementalModelPath = path.join(root, 'outputs', 'yolo26-train', 'ppe-yolo26n-incremental', 'weights', 'best.pt')
const legacyModelPath = path.join(root, 'outputs', 'yolo26-train', 'ppe-yolo26n', 'weights', 'best.pt')
const modelPath = process.env.PPE_MODEL || [packagedModelPath, finalIncrementalModelPath, incrementalModelPath, legacyModelPath].find((candidate) => fs.existsSync(candidate))
const virtualEnvironmentPython = process.platform === 'win32' ? path.join(root, '.venv', 'Scripts', 'python.exe') : path.join(root, '.venv', 'bin', 'python')
const python = process.env.PPE_PYTHON || (fs.existsSync(virtualEnvironmentPython) ? virtualEnvironmentPython : (process.platform === 'win32' ? 'python' : 'python3'))
const ultralyticsSitePackages = process.env.PPE_ULTRALYTICS_SITE_PACKAGES || ''
const inferenceExecutable = process.env.PPE_INFERENCE_EXECUTABLE ? path.resolve(process.env.PPE_INFERENCE_EXECUTABLE) : ''
const datasetImportExecutable = process.env.PPE_DATASET_IMPORT_EXECUTABLE ? path.resolve(process.env.PPE_DATASET_IMPORT_EXECUTABLE) : ''
const mime = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.mp4': 'video/mp4', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg'
}
let inferenceProcess
let customLogsDirectory = ''
let datasetImportInProgress = false

function isLoopbackAddress(value) {
  return ['127.0.0.1', 'localhost', '::1'].includes(String(value).toLowerCase())
}

function secureHeaders(extra = {}) {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'no-referrer',
    'Permissions-Policy': 'camera=(self), microphone=(), geolocation=()',
    'Content-Security-Policy': "default-src 'self'; base-uri 'self'; connect-src 'self'; font-src 'self'; frame-ancestors 'none'; img-src 'self' blob: data:; media-src 'self' blob:; object-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'",
    ...extra,
  }
}

function safeEqual(left, right) {
  const leftBuffer = Buffer.from(String(left))
  const rightBuffer = Buffer.from(String(right))
  return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer)
}

function isAuthorized(req) {
  if (!accessUsername && !accessPassword) return true
  const authorization = req.headers.authorization || ''
  if (!authorization.startsWith('Basic ')) return false
  let decoded = ''
  try { decoded = Buffer.from(authorization.slice(6), 'base64').toString('utf8') } catch (_) { return false }
  const separator = decoded.indexOf(':')
  if (separator < 0) return false
  return safeEqual(decoded.slice(0, separator), accessUsername) && safeEqual(decoded.slice(separator + 1), accessPassword)
}

function requestAuthentication(res) {
  res.writeHead(401, secureHeaders({ 'Content-Type': 'text/plain; charset=utf-8', 'WWW-Authenticate': 'Basic realm="PPE Sentinel", charset="UTF-8"' }))
  res.end('Authentication required')
}

function startInferenceWorker() {
  if (!modelPath || !fs.existsSync(modelPath)) {
    console.error('PPE model not found. Set PPE_MODEL or place the trained model at models/ppe-yolo26n.pt.')
    return
  }
  const args = ['--model', modelPath, '--port', String(inferencePort), '--device', process.env.PPE_DEVICE || 'auto', '--imgsz', process.env.PPE_IMGSZ || '512']
  const command = inferenceExecutable || python
  if (!inferenceExecutable) args.unshift(path.join(root, 'scripts', 'camera_inference_server.py'))
  if (!inferenceExecutable && ultralyticsSitePackages) args.push('--ultralytics-site-packages', ultralyticsSitePackages)
  inferenceProcess = spawn(command, args, { cwd: root, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] })
  inferenceProcess.stdout.on('data', (data) => process.stdout.write(`[inference] ${data}`))
  inferenceProcess.stderr.on('data', (data) => process.stderr.write(`[inference] ${data}`))
  inferenceProcess.on('error', (error) => console.error(`Could not start inference service: ${error.message}`))
  inferenceProcess.on('exit', (code) => {
    inferenceProcess = undefined
    if (code !== 0 && code !== null) console.error(`Inference service exited with code ${code}`)
  })
}

function sendJson(res, status, payload) {
  const body = Buffer.from(JSON.stringify(payload))
  res.writeHead(status, secureHeaders({ 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': body.length, 'Cache-Control': 'no-store' }))
  res.end(body)
}

function localDateStamp(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function appendDetectionLog(req, res) {
  const chunks = []
  let length = 0
  req.on('data', (chunk) => {
    length += chunk.length
    if (length > 256 * 1024) req.destroy()
    else chunks.push(chunk)
  })
  req.on('error', () => sendJson(res, 400, { error: 'Unable to read log entry' }))
  req.on('end', () => {
    if (length <= 0 || length > 256 * 1024) {
      sendJson(res, 413, { error: 'Log entry must be 1 byte to 256 KB' })
      return
    }
    let entry
    try {
      entry = JSON.parse(Buffer.concat(chunks).toString('utf8'))
    } catch (_) {
      sendJson(res, 400, { error: 'Log entry must be valid JSON' })
      return
    }
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      sendJson(res, 400, { error: 'Log entry must be a JSON object' })
      return
    }
    const useCustomDirectory = req.headers['x-ppe-log-destination'] === 'custom' && customLogsDirectory
    const targetDirectory = useCustomDirectory ? customLogsDirectory : logsDirectory
    const fileName = `ppe-detections-${localDateStamp()}.jsonl`
    const filePath = path.join(targetDirectory, fileName)
    const record = { ...entry, server_received_at: new Date().toISOString() }
    fs.mkdir(targetDirectory, { recursive: true }, (directoryError) => {
      if (directoryError) { sendJson(res, 500, { error: 'Unable to create log directory' }); return }
      fs.appendFile(filePath, `${JSON.stringify(record)}\n`, 'utf8', (writeError) => {
        if (writeError) { sendJson(res, 500, { error: 'Unable to write detection log' }); return }
        sendJson(res, 201, { ok: true, path: filePath, file: fileName })
      })
    })
  })
}

function setCustomLogDirectory(req, res) {
  const chunks = []
  let length = 0
  req.on('data', (chunk) => {
    length += chunk.length
    if (length > 16 * 1024) req.destroy()
    else chunks.push(chunk)
  })
  req.on('error', () => sendJson(res, 400, { error: 'Unable to read log configuration' }))
  req.on('end', () => {
    if (length <= 0 || length > 16 * 1024) { sendJson(res, 413, { error: 'Log configuration is too large' }); return }
    let payload
    try { payload = JSON.parse(Buffer.concat(chunks).toString('utf8')) } catch (_) { sendJson(res, 400, { error: 'Log configuration must be valid JSON' }); return }
    const directory = typeof payload?.directory === 'string' ? payload.directory.trim() : ''
    if (!directory || !path.isAbsolute(directory)) { sendJson(res, 400, { error: 'Log directory must be an absolute path' }); return }
    const resolved = path.resolve(directory)
    fs.stat(resolved, (error, stats) => {
      if (error || !stats.isDirectory()) { sendJson(res, 400, { error: 'Log directory does not exist or is not a directory' }); return }
      customLogsDirectory = resolved
      sendJson(res, 200, { ok: true, custom_directory: publicMode ? 'server-managed custom directory' : customLogsDirectory })
    })
  })
}

async function datasetManifests() {
  await fs.promises.mkdir(datasetsDirectory, { recursive: true })
  const entries = await fs.promises.readdir(datasetsDirectory, { withFileTypes: true })
  const datasets = []
  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name.startsWith('.')) continue
    const directory = path.join(datasetsDirectory, entry.name)
    const manifestPath = path.join(directory, 'dataset-manifest.json')
    try {
      const manifest = JSON.parse(await fs.promises.readFile(manifestPath, 'utf8'))
      datasets.push({ ...manifest, directory, managed: true })
    } catch (_) {
      datasets.push({ name: entry.name, directory, managed: false })
    }
  }
  return datasets.sort((left, right) => left.name.localeCompare(right.name))
}

function listDatasets(res) {
  datasetManifests()
    .then((datasets) => sendJson(res, 200, {
      datasets: publicMode ? datasets.map(({ directory, config_path, ...dataset }) => dataset) : datasets,
      registry_directory: publicMode ? 'server-managed datasets' : datasetsDirectory,
      importing: datasetImportInProgress,
    }))
    .catch(() => sendJson(res, 500, { error: 'Unable to read the dataset registry' }))
}

function runDatasetImporter(uploadPath, datasetName) {
  return new Promise((resolve, reject) => {
    const args = ['--source', uploadPath, '--registry', datasetsDirectory, '--name', datasetName, '--json']
    const command = datasetImportExecutable || python
    if (!datasetImportExecutable) args.unshift(path.join(root, 'scripts', 'import_dataset.py'))
    const child = spawn(command, args, { cwd: root, windowsHide: true, env: { ...process.env, PYTHONUTF8: '1' } })
    let stdout = ''
    let stderr = ''
    let outputTooLarge = false
    const timeout = setTimeout(() => child.kill(), 30 * 60 * 1000)
    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString()
      if (stdout.length > 2 * 1024 * 1024) { outputTooLarge = true; child.kill() }
    })
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString()
      if (stderr.length > 2 * 1024 * 1024) { outputTooLarge = true; child.kill() }
    })
    child.on('error', reject)
    child.on('exit', (code) => {
      clearTimeout(timeout)
      if (outputTooLarge) { reject(new Error('Dataset importer output exceeded its safety limit')); return }
      const lines = stdout.trim().split(/\r?\n/).filter(Boolean)
      let result
      try { result = JSON.parse(lines.at(-1) || '{}') } catch (_) { result = null }
      if (code === 0 && result?.ok) resolve(result)
      else reject(new Error(result?.error || stderr.trim() || `Dataset importer exited with code ${code}`))
    })
  })
}

function importDatasetArchive(req, res, requestUrl) {
  if (datasetImportInProgress) { sendJson(res, 409, { error: 'Another dataset import is already running' }); return }
  const contentType = String(req.headers['content-type'] || '').split(';')[0].trim().toLowerCase()
  if (!['application/zip', 'application/octet-stream'].includes(contentType)) {
    sendJson(res, 415, { error: 'Upload a YOLO ZIP archive with Content-Type application/zip' })
    return
  }
  const contentLength = Number(req.headers['content-length'] || 0)
  if (contentLength > maxDatasetUploadBytes) {
    sendJson(res, 413, { error: `Dataset archive exceeds ${Math.round(maxDatasetUploadBytes / 1024 / 1024)} MB` })
    req.resume()
    return
  }
  const datasetName = String(requestUrl.searchParams.get('name') || '').trim()
  if (!datasetName || datasetName.length > 120) {
    sendJson(res, 400, { error: 'A dataset name is required' })
    req.resume()
    return
  }
  const incomingDirectory = path.join(datasetsDirectory, '.incoming')
  fs.mkdirSync(incomingDirectory, { recursive: true })
  const uploadPath = path.join(incomingDirectory, `${Date.now()}-${crypto.randomUUID()}.zip`)
  const output = fs.createWriteStream(uploadPath, { flags: 'wx' })
  let bytes = 0
  let settled = false
  datasetImportInProgress = true

  const cleanup = () => fs.promises.rm(uploadPath, { force: true }).catch(() => {})
  const fail = (status, message) => {
    if (settled) return
    settled = true
    datasetImportInProgress = false
    req.unpipe(output)
    output.destroy()
    req.resume()
    cleanup().finally(() => sendJson(res, status, { error: message }))
  }
  req.on('data', (chunk) => {
    bytes += chunk.length
    if (bytes > maxDatasetUploadBytes) fail(413, `Dataset archive exceeds ${Math.round(maxDatasetUploadBytes / 1024 / 1024)} MB`)
  })
  req.on('aborted', () => fail(400, 'Dataset upload was interrupted'))
  req.on('error', () => fail(400, 'Unable to read the dataset upload'))
  output.on('error', () => fail(500, 'Unable to store the dataset upload'))
  output.on('finish', async () => {
    if (settled) return
    try {
      const result = await runDatasetImporter(uploadPath, datasetName)
      settled = true
      datasetImportInProgress = false
      await cleanup()
      if (publicMode && result?.dataset) {
        const { directory, config_path, ...dataset } = result.dataset
        result.dataset = dataset
      }
      sendJson(res, 201, result)
    } catch (error) {
      settled = true
      datasetImportInProgress = false
      await cleanup()
      sendJson(res, 400, { error: error.message })
    }
  })
  req.pipe(output)
}

function proxyInference(req, res, pathname) {
  const chunks = []
  let length = 0
  req.on('data', (chunk) => {
    length += chunk.length
    if (length > 5 * 1024 * 1024) { req.destroy() } else { chunks.push(chunk) }
  })
  req.on('error', () => sendJson(res, 400, { error: 'Unable to read image data' }))
  req.on('end', () => {
    if (length <= 0 || length > 5 * 1024 * 1024) {
      sendJson(res, 413, { error: 'Image must be 1 byte to 5 MB' })
      return
    }
    const body = Buffer.concat(chunks)
    const headers = {
      'content-type': req.headers['content-type'] || 'image/jpeg',
      'content-length': body.length,
      'x-ppe-confidence': req.headers['x-ppe-confidence'] || '0.65',
      'x-ppe-iou': req.headers['x-ppe-iou'] || '0.70',
      'x-ppe-classes': req.headers['x-ppe-classes'] || ''
    }
    const backend = http.request({ hostname: '127.0.0.1', port: inferencePort, path: pathname, method: req.method, headers, timeout: 30000 }, (backendRes) => {
      const responseChunks = []
      backendRes.on('data', (chunk) => responseChunks.push(chunk))
      backendRes.on('end', () => {
        res.writeHead(backendRes.statusCode || 502, secureHeaders({ 'Content-Type': backendRes.headers['content-type'] || 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }))
        res.end(Buffer.concat(responseChunks))
      })
    })
    backend.on('timeout', () => backend.destroy(new Error('Inference request timed out')))
    backend.on('error', () => sendJson(res, 503, { error: 'PPE inference is starting. Retry in a moment.' }))
    backend.end(body)
  })
}

function proxyHealth(req, res) {
  const backend = http.request({ hostname: '127.0.0.1', port: inferencePort, path: '/health', method: 'GET', timeout: 2000 }, (backendRes) => {
    const chunks = []
    backendRes.on('data', (chunk) => chunks.push(chunk))
    backendRes.on('end', () => {
      res.writeHead(backendRes.statusCode || 502, secureHeaders({ 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }))
      res.end(Buffer.concat(chunks))
    })
  })
  backend.on('timeout', () => backend.destroy())
  backend.on('error', () => sendJson(res, 503, { status: 'starting', error: 'PPE inference is starting' }))
  backend.end()
}

function requestHandler(req, res) {
  const requestUrl = new URL(req.url || '/', 'http://ppe.local')
  const pathname = decodeURIComponent(requestUrl.pathname)
  if (pathname === '/healthz' && req.method === 'GET') return sendJson(res, 200, { status: 'ok' })
  if (!isAuthorized(req)) return requestAuthentication(res)
  if (pathname === '/api/health' && req.method === 'GET') return proxyHealth(req, res)
  if (pathname === '/api/infer' && req.method === 'POST') return proxyInference(req, res, '/infer')
  if (pathname === '/api/log-config' && req.method === 'GET') return sendJson(res, 200, {
    default_directory: publicMode ? 'server-managed logs' : logsDirectory,
    custom_directory: publicMode && customLogsDirectory ? 'server-managed custom directory' : customLogsDirectory,
    file_pattern: 'ppe-detections-YYYY-MM-DD.jsonl',
  })
  if (pathname === '/api/log-config' && req.method === 'POST') return setCustomLogDirectory(req, res)
  if (pathname === '/api/logs' && req.method === 'POST') return appendDetectionLog(req, res)
  if (pathname === '/api/maintenance/datasets' && req.method === 'GET') return listDatasets(res)
  if (pathname === '/api/maintenance/datasets/import' && req.method === 'POST') return importDatasetArchive(req, res, requestUrl)
  const relative = pathname === '/' ? '/index.html' : pathname
  const filePath = path.resolve(root, `.${relative}`)
  if (filePath !== root && !filePath.startsWith(`${root}${path.sep}`)) { res.writeHead(403, secureHeaders()); res.end('Forbidden'); return }
  fs.readFile(filePath, (error, data) => {
    if (error) { res.writeHead(404, secureHeaders()); res.end('Not found'); return }
    res.writeHead(200, secureHeaders({ 'Content-Type': mime[path.extname(filePath).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store' }))
    res.end(data)
  })
}

if ((accessUsername && !accessPassword) || (!accessUsername && accessPassword)) {
  throw new Error('Set both PPE_USERNAME and PPE_PASSWORD, or leave both unset')
}
if ((publicMode || !isLoopbackAddress(host)) && !accessUsername && !allowInsecurePublic) {
  throw new Error('Public binding requires PPE_USERNAME and PPE_PASSWORD. Set PPE_ALLOW_INSECURE_PUBLIC=1 only behind another authenticated gateway.')
}
if (Boolean(tlsCertificatePath) !== Boolean(tlsKeyPath)) {
  throw new Error('PPE_TLS_CERT and PPE_TLS_KEY must be configured together')
}
const tlsEnabled = Boolean(tlsCertificatePath && tlsKeyPath)
const server = tlsEnabled
  ? https.createServer({ cert: fs.readFileSync(tlsCertificatePath), key: fs.readFileSync(tlsKeyPath) }, requestHandler)
  : http.createServer(requestHandler)

server.listen(port, host, () => {
  const protocol = tlsEnabled ? 'https' : 'http'
  console.log(`PPE Sentinel running at ${protocol}://${host}:${port}`)
  if ((publicMode || !isLoopbackAddress(host)) && !tlsEnabled) console.warn('Remote camera access requires HTTPS. Terminate TLS at a reverse proxy or configure PPE_TLS_CERT/PPE_TLS_KEY.')
  startInferenceWorker()
})

function shutdown() {
  if (inferenceProcess && !inferenceProcess.killed) inferenceProcess.kill()
  server.close()
}
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
