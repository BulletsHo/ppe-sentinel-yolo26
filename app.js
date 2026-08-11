const TARGETS = [
  { key: 'mask', classNames: ['Mask', 'NO-Mask'], nameKey: 'targetMask', color: '#b69cff' },
  { key: 'gloves', classNames: ['Gloves', 'NO-Gloves'], nameKey: 'targetGloves', color: '#b69cff' },
  { key: 'vest', classNames: ['Safety Vest', 'NO-Safety Vest'], nameKey: 'targetVest', color: '#d2f15a' },
  { key: 'goggles', classNames: ['Goggles', 'NO-Goggles'], nameKey: 'targetGoggles', color: '#f2ad61' },
  { key: 'coverall', classNames: ['Coverall', 'NO-Coverall'], nameKey: 'targetCoverall', color: '#70d3b0' },
  { key: 'ear', classNames: ['Ear Protection', 'Earmuffs', 'NO-Ear Protection', 'NO-Earmuffs'], nameKey: 'targetEar', noteKey: 'earLimited', color: '#68b9ff' },
]

const TARGET_KEYS = TARGETS.map((target) => target.key)
const CAMERA_MAX_DIMENSION = 512
const CAMERA_JPEG_QUALITY = 0.68

const I18N = {
  zh: {
    brandSubtitle: 'YOLO26 PPE 检测系统', workspace: '工作区', realtimeDetection: '实时检测', inferenceService: '推理服务', connecting: '连接中', device: '设备', input: '输入', loadingModel: '正在加载本地模型',
    breadcrumbWorkspace: '工作区', situation: '现场态势', waitingCamera: '等待摄像头', currentPeople: '当前画面人数', basedPerson: '基于 Person 检测', detectionTargets: '检测目标', currentFrame: '当前推理帧', violations: '违规告警', noPpeClasses: 'NO-* PPE 类别', localModelStatus: '本地模型状态', waitingService: '等待服务', threshold: '阈值', endToEndLatency: '端到端延迟', videoInput: '视频输入',
    liveCameraTitle: '浏览器摄像头实时 PPE 检测', waitingInput: '等待输入', uploadAlt: '上传待检测图像', waitingFirstFrame: '等待首帧', cameraNotEnabled: '尚未启用摄像头', clickStart: '点击下方启动按钮后开始实时检测', idle: '空闲', waitingStart: '等待启动', camera: '摄像头', imageDetection: '检测图片', localCamera: '本地浏览器摄像头', clear: '清除', startCamera: '启动摄像头', pauseDetection: '暂停检测', resumeDetection: '恢复检测',
    activeModel: '活动模型', task: '任务', objectDetection: '目标检测', testMap: '测试 mAP@50', cameraThreshold: '摄像头阈值', cameraInference: '模型推理', currentResults: '当前帧识别结果', startCameraResults: '启动摄像头后显示真实检测结果', configTitle: '实时检测配置', localEffective: '本地生效', confidenceThreshold: '置信度阈值', samplingNote: '自适应逐帧推理，不积压过期画面', cameraPermission: '摄像头权限', notRequested: '尚未请求', privacy: '隐私说明', privacyNote: '画面仅发送到当前部署的 PPE 推理服务', edgeStatus: '推理服务', model: '模型', address: '地址', endpoint: '接口',
    ppeTargets: 'PPE 检测项', targetElements: '检测要素', enabled: '已开启', currentModel: '已开启', disabled: '已关闭', unavailable: '模型不可用', targetMask: '口罩', targetGloves: '手套', targetVest: '反光衣', targetGoggles: '护目镜', targetCoverall: '连体防护服', targetEar: '防噪耳机', earLimited: '该类别训练样本很少，检测结果仅供试用', language: '界面语言', theme: '界面主题', dark: '深色', light: '浅色',
    ready: '就绪', modelReady: '模型已就绪', modelLoaded: '{model} 已加载', loading: '加载中', firstLoad: '首次启动约需数秒', waitingLocalService: '等待本地服务', healthy: '正常', live: '实时', paused: '已暂停', cameraError: '摄像头错误', inferenceRetrying: '推理重试中', analyzing: '分析中', inferenceError: '推理错误', dataRunning: '数据流运行中',
    browserUnsupported: '浏览器不支持摄像头', browserUnsupportedDetail: '请使用现代浏览器；远程访问必须启用 HTTPS', requestingPermission: '正在请求摄像头权限', allowPermission: '请在浏览器弹窗中允许访问摄像头', permissionRequesting: '正在请求权限', permissionGranted: '已授权，仅发送到当前推理服务', permissionDenied: '摄像头权限被拒绝', cameraUnavailable: '无法打开摄像头', cameraUnavailableDetail: '检查浏览器权限或摄像头是否被其他应用占用',
    cameraDevice: '摄像头设备', automaticCamera: '自动选择内置摄像头', cameraNumber: '摄像头 {count}', noCameraFound: '未检测到摄像头', refreshDevices: '刷新摄像头设备', switchingCamera: '正在切换摄像头', cameraSelected: '当前设备：{name}', cameraAutoSelected: '已自动选择内置设备：{name}',
    loggingTitle: '本地检测日志', loggingSwitch: '保存检测日志', loggingOn: '已开启', loggingOff: '已关闭', logDestination: '存储位置', defaultLogPath: '系统默认路径', customLogFolder: '用户选择文件夹', chooseFolder: '选择文件夹', chooseAgain: '重新选择', enterFolderPath: '输入本机绝对目录，例如 C:\\PPE-Logs', applyPath: '应用路径', logPath: '当前路径', logDefaultPending: '正在读取默认路径', loggingInactive: '日志记录已关闭', loggingReady: '日志已开启，仅保存有检测结果的帧（最多每秒一条）', loggingSaved: '已写入 {file}', logWriteFailed: '日志写入失败', customFolderRequired: '请先选择一个文件夹或输入绝对目录', invalidFolderPath: '目录不存在或不可用，请检查绝对路径', folderUnsupported: '当前浏览器不支持文件夹选择，请输入本机绝对目录', folderSelected: '已选择文件夹：{name}', customPathSaved: '已应用自定义路径：{name}',
    datasetMaintenance: '测试数据集维护', datasetMaintenanceNote: '导入 YOLO ZIP 数据集，完成安全解压、类别与标注校验；不会自动训练模型', datasetRegistry: '数据集目录', datasetName: '数据集名称', datasetNamePlaceholder: '例如 site-ppe-test-v1', chooseDataset: '选择 ZIP', importDataset: '导入并校验', refreshDatasets: '刷新数据集', noDatasets: '尚未导入维护数据集', datasetIdle: '等待选择 YOLO ZIP 数据集', datasetZipRequired: '请选择有效的 ZIP 数据集文件', datasetReady: '已选择 {name}', datasetUploading: '正在上传并校验数据集，请勿关闭页面', datasetImported: '数据集 {name} 已导入', datasetImportFailed: '数据集导入失败：{message}', datasetCount: '{count} 个数据集', datasetClasses: '{count} 类', datasetImages: '{count} 张图片',
    noDetections: '当前帧未检测到超过阈值的目标', items: '{count} 项', needsAttention: '需关注', ppeDetected: '检测到 PPE', inferenceFailed: '推理连接失败', inferenceUnavailable: '推理服务不可用', imageFailed: '图片检测失败', retry: '请重试', detectionFailed: '检测失败', waitingNextFrame: '等待下一帧', targetsBadge: '{count} 个目标', latencyStatus: '端到端 {total} · 模型 {model}', fps: '{value} FPS',
  },
  en: {
    brandSubtitle: 'YOLO26 PPE Detection', workspace: 'Workspace', realtimeDetection: 'Live Detection', inferenceService: 'Inference Service', connecting: 'Connecting', device: 'Device', input: 'Input', loadingModel: 'Loading local model',
    breadcrumbWorkspace: 'Workspace', situation: 'Site Overview', waitingCamera: 'Waiting for camera', currentPeople: 'People in Frame', basedPerson: 'Based on Person detections', detectionTargets: 'Detected Objects', currentFrame: 'Current inference frame', violations: 'PPE Alerts', noPpeClasses: 'NO-* PPE classes', localModelStatus: 'Local Model Status', waitingService: 'Waiting for service', threshold: 'Threshold', endToEndLatency: 'End-to-end latency', videoInput: 'Video input',
    liveCameraTitle: 'Live Browser Camera PPE Detection', waitingInput: 'Waiting for input', uploadAlt: 'Uploaded image for detection', waitingFirstFrame: 'Waiting for first frame', cameraNotEnabled: 'Camera is not enabled', clickStart: 'Use the start button below to begin live detection', idle: 'IDLE', waitingStart: 'Waiting to start', camera: 'Camera', imageDetection: 'Detect Image', localCamera: 'Local browser camera', clear: 'Clear', startCamera: 'Start camera', pauseDetection: 'Pause detection', resumeDetection: 'Resume detection',
    activeModel: 'Active Model', task: 'Task', objectDetection: 'Object Detection', testMap: 'Test mAP@50', cameraThreshold: 'Camera threshold', cameraInference: 'Model inference', currentResults: 'Current Frame Results', startCameraResults: 'Start the camera to show live detections', configTitle: 'Live Detection Settings', localEffective: 'Applied locally', confidenceThreshold: 'Confidence threshold', samplingNote: 'Adaptive sequential inference prevents stale-frame queues', cameraPermission: 'Camera permission', notRequested: 'Not requested', privacy: 'Privacy', privacyNote: 'Frames are sent only to the currently deployed PPE inference service', edgeStatus: 'Inference Service', model: 'Model', address: 'Address', endpoint: 'Endpoint',
    ppeTargets: 'PPE Targets', targetElements: 'Detection Targets', enabled: 'enabled', currentModel: 'Enabled', disabled: 'Disabled', unavailable: 'Unavailable', targetMask: 'Mask', targetGloves: 'Gloves', targetVest: 'Safety Vest', targetGoggles: 'Goggles', targetCoverall: 'Coverall', targetEar: 'Hearing Protection', earLimited: 'This class has very few training samples; results are experimental', language: 'Interface language', theme: 'Interface theme', dark: 'Dark', light: 'Light',
    ready: 'Ready', modelReady: 'Model ready', modelLoaded: '{model} loaded', loading: 'Loading', firstLoad: 'Initial startup can take a few seconds', waitingLocalService: 'Waiting for local service', healthy: 'Healthy', live: 'LIVE', paused: 'PAUSED', cameraError: 'CAMERA ERROR', inferenceRetrying: 'INFERENCE RETRYING', analyzing: 'ANALYZING', inferenceError: 'INFERENCE ERROR', dataRunning: 'Camera stream is live',
    browserUnsupported: 'Camera is not supported', browserUnsupportedDetail: 'Use a modern browser; remote access requires HTTPS', requestingPermission: 'Requesting camera permission', allowPermission: 'Allow camera access in the browser prompt', permissionRequesting: 'Requesting permission', permissionGranted: 'Authorized for the current inference service', permissionDenied: 'Camera permission denied', cameraUnavailable: 'Unable to open camera', cameraUnavailableDetail: 'Check browser permission and whether another app is using the camera',
    cameraDevice: 'Camera device', automaticCamera: 'Auto-select built-in camera', cameraNumber: 'Camera {count}', noCameraFound: 'No camera detected', refreshDevices: 'Refresh camera devices', switchingCamera: 'Switching camera', cameraSelected: 'Current device: {name}', cameraAutoSelected: 'Built-in camera selected: {name}',
    loggingTitle: 'Local Detection Logs', loggingSwitch: 'Save detection logs', loggingOn: 'Enabled', loggingOff: 'Disabled', logDestination: 'Storage location', defaultLogPath: 'System default path', customLogFolder: 'User-selected folder', chooseFolder: 'Choose Folder', chooseAgain: 'Choose Again', enterFolderPath: 'Enter an absolute local path, for example C:\\PPE-Logs', applyPath: 'Apply Path', logPath: 'Current path', logDefaultPending: 'Loading default path', loggingInactive: 'Detection logging is disabled', loggingReady: 'Logging is active for frames with detections (at most one entry per second)', loggingSaved: 'Saved to {file}', logWriteFailed: 'Unable to write detection log', customFolderRequired: 'Choose a folder or enter an absolute path first', invalidFolderPath: 'The directory does not exist or is unavailable', folderUnsupported: 'Folder selection is unavailable; enter an absolute local path', folderSelected: 'Selected folder: {name}', customPathSaved: 'Custom path applied: {name}',
    datasetMaintenance: 'Test Dataset Maintenance', datasetMaintenanceNote: 'Import a YOLO ZIP dataset with safe extraction, class validation, and label validation; training is never started automatically', datasetRegistry: 'Dataset registry', datasetName: 'Dataset name', datasetNamePlaceholder: 'For example site-ppe-test-v1', chooseDataset: 'Choose ZIP', importDataset: 'Import and Validate', refreshDatasets: 'Refresh datasets', noDatasets: 'No maintenance datasets imported', datasetIdle: 'Choose a YOLO ZIP dataset', datasetZipRequired: 'Choose a valid ZIP dataset archive', datasetReady: 'Selected {name}', datasetUploading: 'Uploading and validating the dataset; keep this page open', datasetImported: 'Dataset {name} imported', datasetImportFailed: 'Dataset import failed: {message}', datasetCount: '{count} datasets', datasetClasses: '{count} classes', datasetImages: '{count} images',
    noDetections: 'No objects above the threshold in this frame', items: '{count} items', needsAttention: 'Needs attention', ppeDetected: 'PPE detected', inferenceFailed: 'Inference connection failed', inferenceUnavailable: 'Inference service unavailable', imageFailed: 'Image detection failed', retry: 'Please retry', detectionFailed: 'Detection failed', waitingNextFrame: 'Waiting for next frame', targetsBadge: '{count} objects', latencyStatus: 'End-to-end {total} · model {model}', fps: '{value} FPS',
  },
}

const CLASS_LABELS = {
  zh: {
    Person: '人员', Hardhat: '安全帽', 'NO-Hardhat': '未戴安全帽', 'Safety Vest': '反光衣', 'NO-Safety Vest': '未穿反光衣', Mask: '口罩', 'NO-Mask': '未戴口罩', Gloves: '手套', 'NO-Gloves': '未戴手套', Goggles: '护目镜', 'NO-Goggles': '未戴护目镜', Coverall: '连体防护服', 'NO-Coverall': '未穿连体防护服', 'Ear Protection': '防噪耳机', Earmuffs: '防噪耳机', 'NO-Ear Protection': '未戴防噪耳机', 'NO-Earmuffs': '未戴防噪耳机',
  },
  en: {},
}

function loadLanguage() {
  try { return localStorage.getItem('ppe-language') === 'en' ? 'en' : 'zh' } catch (_) { return 'zh' }
}

function loadTheme() {
  try { return localStorage.getItem('ppe-theme') === 'light' ? 'light' : 'dark' } catch (_) { return 'dark' }
}

function loadCameraDeviceId() {
  try { return localStorage.getItem('ppe-camera-device') || '' } catch (_) { return '' }
}

function loadLoggingEnabled() {
  try { return localStorage.getItem('ppe-logging-enabled') === 'true' } catch (_) { return false }
}

function loadLogDestination() {
  try { return localStorage.getItem('ppe-log-destination') === 'custom' ? 'custom' : 'default' } catch (_) { return 'default' }
}

function loadEnabledTargets() {
  try {
    const saved = JSON.parse(localStorage.getItem('ppe-enabled-targets'))
    if (Array.isArray(saved)) return new Set(saved.filter((key) => TARGET_KEYS.includes(key)))
  } catch (_) {}
  return new Set(TARGET_KEYS)
}

const state = {
  stream: null,
  running: false,
  processing: false,
  timer: null,
  rawDetections: [],
  detections: [],
  inferenceMs: null,
  totalMs: null,
  confidence: 0.25,
  error: '',
  source: 'camera',
  lastImageUrl: '',
  modelClasses: [],
  health: null,
  language: loadLanguage(),
  theme: loadTheme(),
  enabledTargets: loadEnabledTargets(),
  permissionState: 'notRequested',
  frameWidth: 0,
  frameHeight: 0,
  cameraMessage: { titleKey: 'cameraNotEnabled', detailKey: 'clickStart' },
  videoDevices: [],
  selectedDeviceId: loadCameraDeviceId(),
  cameraSelectionIsAutomatic: !loadCameraDeviceId(),
  loggingEnabled: loadLoggingEnabled(),
  logDestination: loadLogDestination(),
  logDirectoryHandle: null,
  forceManualLogPath: false,
  logServerDirectory: '',
  logDefaultDirectory: '',
  logLastFile: '',
  logLastAt: 0,
  logQueue: Promise.resolve(),
  logStatusKey: loadLoggingEnabled() ? 'loggingReady' : 'loggingInactive',
  logStatusValues: {},
  datasetFile: null,
  datasetImporting: false,
  datasetRegistry: '',
  datasets: [],
  datasetStatusKey: 'datasetIdle',
  datasetStatusValues: {},
}

const icon = (name) => ({
  video: '<svg viewBox="0 0 24 24"><rect x="3" y="6" width="13" height="12" rx="2"/><path d="m16 10 5-3v10l-5-3"/></svg>',
  play: '<svg viewBox="0 0 24 24"><path d="m8 5 11 7-11 7V5Z"/></svg>',
  pause: '<svg viewBox="0 0 24 24"><path d="M8 5v14M16 5v14"/></svg>',
  upload: '<svg viewBox="0 0 24 24"><path d="M12 16V4M7 9l5-5 5 5M5 20h14"/></svg>',
  refresh: '<svg viewBox="0 0 24 24"><path d="M20 11a8 8 0 0 0-14-4L4 9M4 5v4h4M4 13a8 8 0 0 0 14 4l2-2M20 19v-4h-4"/></svg>',
  shield: '<svg viewBox="0 0 24 24"><path d="M12 3 20 6v5c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-3Z"/><path d="m8.5 12 2.2 2.2 4.8-5"/></svg>',
  alert: '<svg viewBox="0 0 24 24"><path d="m12 3 10 18H2L12 3Z"/><path d="M12 9v5M12 18h.01"/></svg>',
  activity: '<svg viewBox="0 0 24 24"><path d="M3 12h4l2-7 4 14 2-7h6"/></svg>',
  cpu: '<svg viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="2"/><path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4"/></svg>',
  folder: '<svg viewBox="0 0 24 24"><path d="M3 6h7l2 2h9v10H3V6Z"/><path d="M3 9h18"/></svg>',
  database: '<svg viewBox="0 0 24 24"><ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v7c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12v7c0 1.7 3.6 3 8 3s8-1.3 8-3v-7"/></svg>',
}[name] || '')

const dot = (tone = 'green') => `<span class="status-dot ${tone}"></span>`
const t = (key, values = {}) => Object.entries(values).reduce((text, [name, value]) => text.replaceAll(`{${name}}`, String(value)), I18N[state.language][key] || key)
const label = (value) => CLASS_LABELS[state.language][value] || value
const isViolation = (value) => /^no[- ]/i.test(value)

function renderTargetCapabilities(classes = state.modelClasses) {
  const configPanel = document.querySelector('.config-panel')
  if (!configPanel) return
  let panel = document.querySelector('#target-capabilities')
  if (!panel) {
    panel = document.createElement('div')
    panel.id = 'target-capabilities'
    panel.className = 'target-capabilities'
    configPanel.appendChild(panel)
  }
  const available = new Set(classes)
  const isSupported = (target) => target.classNames.some((name) => available.has(name))
  const supportedCount = TARGETS.filter(isSupported).length
  const activeCount = TARGETS.filter((target) => isSupported(target) && state.enabledTargets.has(target.key)).length
  panel.innerHTML = `<div class="target-capabilities-head"><div><span class="section-kicker">${icon('shield')} ${t('ppeTargets')}</span><strong>${t('targetElements')}</strong></div><span>${activeCount}/${supportedCount} ${t('enabled')}</span></div><div class="target-list">${TARGETS.map((target) => {
    const supported = isSupported(target)
    const enabled = supported && state.enabledTargets.has(target.key)
    const status = supported ? (enabled ? t('currentModel') : t('disabled')) : t('unavailable')
    return `<button type="button" class="target-item ${supported ? 'supported' : 'pending'} ${enabled ? 'is-enabled' : 'is-disabled'}" data-target="${target.key}" aria-pressed="${enabled}" ${supported ? '' : 'disabled'} ${target.noteKey ? `title="${t(target.noteKey)}"` : ''}><span class="target-swatch" style="background:${target.color}"></span><strong>${t(target.nameKey)}</strong><span class="target-model">${status}</span><span class="target-toggle" aria-hidden="true"><span></span></span></button>`
  }).join('')}</div>`
  panel.querySelectorAll('[data-target]').forEach((button) => button.addEventListener('click', () => toggleTarget(button.dataset.target)))
}

function render() {
  document.documentElement.lang = state.language === 'zh' ? 'zh-CN' : 'en'
  document.querySelector('#root').innerHTML = `
    <div class="app-shell camera-app">
      <aside class="sidebar">
        <div class="brand"><span class="brand-mark"><span></span><span></span><span></span></span><div><strong>PPE Sentinel</strong><span data-i18n="brandSubtitle">${t('brandSubtitle')}</span></div></div>
        <div class="workspace-label" data-i18n="workspace">${t('workspace')}</div>
        <nav class="side-nav" aria-label="${t('realtimeDetection')}"><button class="active">${icon('video')}<span data-i18n="realtimeDetection">${t('realtimeDetection')}</span><kbd>01</kbd></button></nav>
        <div class="side-spacer"></div>
        <div class="edge-card"><div class="edge-card-head"><span>${dot('muted')}<span data-i18n="inferenceService">${t('inferenceService')}</span></span><span class="live-chip" id="worker-state">${t('connecting')}</span></div><strong>YOLO26N PPE</strong><div class="edge-metrics"><span><small data-i18n="device">${t('device')}</small> <b id="device-value">--</b></span><span><small data-i18n="input">${t('input')}</small> <b id="input-size">512px</b></span></div><div class="edge-progress"><span id="worker-progress"></span></div><div class="edge-foot"><span id="worker-note">${t('loadingModel')}</span></div></div>
      </aside>
      <main class="main-content">
        <header class="topbar"><div><div class="breadcrumb"><span data-i18n="breadcrumbWorkspace">${t('breadcrumbWorkspace')}</span> / <span data-i18n="realtimeDetection">${t('realtimeDetection')}</span></div><h1 data-i18n="situation">${t('situation')}</h1></div><div class="top-actions"><div class="settings-switches"><div class="segmented-switch language-switch" role="group" aria-label="${t('language')}"><button type="button" data-lang="zh" aria-pressed="${state.language === 'zh'}">中文</button><button type="button" data-lang="en" aria-pressed="${state.language === 'en'}">EN</button></div><div class="segmented-switch theme-switch" role="group" aria-label="${t('theme')}"><button type="button" data-theme-value="dark" data-i18n="dark" aria-pressed="${state.theme === 'dark'}">${t('dark')}</button><button type="button" data-theme-value="light" data-i18n="light" aria-pressed="${state.theme === 'light'}">${t('light')}</button></div></div><div class="sync-status" id="header-state">${dot('muted')}<span>${t('waitingCamera')}</span></div></div></header>
        <section class="overview-grid real-metrics">
          <div class="metric-card"><div class="metric-top"><span data-i18n="currentPeople">${t('currentPeople')}</span><div class="metric-icon cyan">${icon('activity')}</div></div><strong id="people-count">--</strong><div class="metric-trend"><span data-i18n="basedPerson">${t('basedPerson')}</span></div></div>
          <div class="metric-card"><div class="metric-top"><span data-i18n="detectionTargets">${t('detectionTargets')}</span><div class="metric-icon lime">${icon('shield')}</div></div><strong id="detection-count">--</strong><div class="metric-trend"><span data-i18n="currentFrame">${t('currentFrame')}</span></div></div>
          <div class="metric-card warning-card"><div class="metric-top"><span data-i18n="violations">${t('violations')}</span><div class="metric-icon amber">${icon('alert')}</div></div><strong id="violation-count">--</strong><div class="metric-trend"><span data-i18n="noPpeClasses">${t('noPpeClasses')}</span></div></div>
          <div class="metric-card chart-card"><div class="metric-top"><span data-i18n="localModelStatus">${t('localModelStatus')}</span><span class="chart-value" id="service-label">${t('waitingService')}</span></div><div class="camera-summary"><div><span data-i18n="threshold">${t('threshold')}</span><strong id="threshold-summary">25%</strong></div><div><span data-i18n="endToEndLatency">${t('endToEndLatency')}</span><strong id="latency-summary">--</strong></div><div><span data-i18n="videoInput">${t('videoInput')}</span><strong id="resolution-summary">--</strong></div></div></div>
        </section>
        <section class="monitor-layout">
          <div class="video-panel panel"><div class="panel-head"><div><span class="section-kicker">${icon('video')} LIVE CAMERA</span><h2 data-i18n="liveCameraTitle">${t('liveCameraTitle')}</h2></div><div class="panel-head-actions"><span class="resolution-chip" id="camera-resolution">${t('waitingInput')}</span></div></div>
            <div class="scene-wrap"><div class="camera-scene real-camera" id="camera-stage">
              <video id="camera-video" autoplay muted playsinline aria-label="${t('camera')}"></video><img id="image-preview" alt="${t('uploadAlt')}" hidden><canvas id="detection-canvas" aria-hidden="true"></canvas><div id="detection-boxes" class="detection-boxes" aria-hidden="true"></div><canvas id="capture-canvas" hidden></canvas><div class="camera-result-badge" id="camera-result-badge">YOLO26 · ${t('waitingFirstFrame')}</div>
              <div class="camera-empty" id="camera-empty">${icon('video')}<strong>${t('cameraNotEnabled')}</strong><span>${t('clickStart')}</span></div>
              <div class="scene-header"><span id="stream-label">LOCAL CAMERA</span><span id="stream-fps">-- FPS</span></div><div class="scene-footer"><span id="live-state">${dot('muted')}${t('idle')}</span><span id="inference-status">${t('waitingStart')}</span></div>
            </div>
            <div class="video-controls"><div class="source-tabs"><button class="selected" id="camera-source" type="button">${icon('video')}<span data-i18n="camera">${t('camera')}</span></button><button id="upload-source" type="button">${icon('upload')}<span data-i18n="imageDetection">${t('imageDetection')}</span></button><input id="upload-file" type="file" accept="image/*" hidden></div><div class="camera-device-control"><label for="camera-device-select" data-i18n="cameraDevice">${t('cameraDevice')}</label><select id="camera-device-select" aria-label="${t('cameraDevice')}"><option value="">${t('automaticCamera')}</option></select><button class="device-refresh" id="refresh-camera-devices" type="button" title="${t('refreshDevices')}">${icon('refresh')}</button></div><div class="file-name" id="source-name">${t('localCamera')}</div><div class="control-actions"><button class="control-play" id="camera-toggle" type="button" title="${t('startCamera')}">${icon('play')}</button><button class="secondary-button compact" id="clear-button" type="button">${icon('refresh')}<span data-i18n="clear">${t('clear')}</span></button></div></div></div>
          </div>
          <aside class="right-rail"><div class="panel model-panel"><div class="panel-head compact-head"><div><span class="section-kicker">${icon('cpu')} <span data-i18n="activeModel">${t('activeModel')}</span></span><h2>YOLO26 PPE · best.pt</h2></div><span class="ready-pill" id="model-ready">${dot('muted')}<span>${t('loading')}</span></span></div><div class="model-meta"><div><span data-i18n="task">${t('task')}</span><strong data-i18n="objectDetection">${t('objectDetection')}</strong></div><div><span data-i18n="testMap">${t('testMap')}</span><strong>0.308</strong></div><div><span data-i18n="cameraThreshold">${t('cameraThreshold')}</span><strong id="model-confidence">0.25</strong></div></div><div class="model-line"><span data-i18n="cameraInference">${t('cameraInference')}</span><strong id="model-latency">--</strong><div class="latency-bar"><span id="latency-bar" style="width:0"></span></div></div></div>
            <div class="panel detections-panel"><div class="panel-head compact-head"><div><span class="section-kicker">${icon('activity')} DETECTIONS</span><h2 data-i18n="currentResults">${t('currentResults')}</h2></div><span class="detection-badge" id="detection-badge">--</span></div><div class="detection-list" id="detection-list"><div class="empty-detections">${t('startCameraResults')}</div></div></div>
          </aside>
        </section>
        <section class="bottom-layout"><div class="panel config-panel"><div class="panel-head compact-head"><div><span class="section-kicker">${icon('shield')} DETECTION CONFIG</span><h2 data-i18n="configTitle">${t('configTitle')}</h2></div><span class="saved-state">${dot()}<span data-i18n="localEffective">${t('localEffective')}</span></span></div><div class="config-grid"><div class="config-field"><label><span data-i18n="confidenceThreshold">${t('confidenceThreshold')}</span> <strong id="confidence-value">25%</strong></label><input id="confidence-range" aria-label="${t('confidenceThreshold')}" type="range" min="10" max="95" value="25" /><span class="field-note" data-i18n="samplingNote">${t('samplingNote')}</span></div><div class="config-field"><label data-i18n="cameraPermission">${t('cameraPermission')}</label><span class="field-note" id="permission-note">${t('notRequested')}</span></div><div class="config-field"><label data-i18n="privacy">${t('privacy')}</label><span class="field-note" data-i18n="privacyNote">${t('privacyNote')}</span></div></div><div class="logging-config"><div class="logging-title"><div><span class="section-kicker">${icon('database')} LOCAL LOG</span><strong data-i18n="loggingTitle">${t('loggingTitle')}</strong></div><button type="button" class="logging-toggle" id="logging-toggle" aria-pressed="${state.loggingEnabled}"><span data-i18n="loggingSwitch">${t('loggingSwitch')}</span><b id="logging-toggle-state">${t(state.loggingEnabled ? 'loggingOn' : 'loggingOff')}</b><span class="target-toggle" aria-hidden="true"><span></span></span></button></div><div class="logging-controls"><label for="log-destination" data-i18n="logDestination">${t('logDestination')}</label><select id="log-destination" aria-label="${t('logDestination')}"><option value="default" ${state.logDestination === 'default' ? 'selected' : ''}>${t('defaultLogPath')}</option><option value="custom" ${state.logDestination === 'custom' ? 'selected' : ''}>${t('customLogFolder')}</option></select><button type="button" class="secondary-button compact" id="choose-log-folder">${icon('folder')}<span data-i18n="chooseFolder">${t('chooseFolder')}</span></button><div class="manual-log-directory" id="manual-log-directory"><input id="manual-log-path" type="text" placeholder="${t('enterFolderPath')}" aria-label="${t('enterFolderPath')}"><button type="button" class="secondary-button compact" id="apply-log-path"><span data-i18n="applyPath">${t('applyPath')}</span></button></div></div><div class="logging-path"><span data-i18n="logPath">${t('logPath')}</span><strong id="log-path">${t('logDefaultPending')}</strong></div><div class="logging-status" id="logging-status">${t(state.logStatusKey, state.logStatusValues)}</div></div></div><div class="panel status-panel"><div class="panel-head compact-head"><div><span class="section-kicker">${icon('cpu')} EDGE STATUS</span><h2 data-i18n="edgeStatus">${t('edgeStatus')}</h2></div><span class="status-chip" id="backend-status">${dot('muted')}<span>${t('loading')}</span></span></div><div class="status-grid"><div><span data-i18n="model">${t('model')}</span><strong>best.pt</strong></div><div><span data-i18n="device">${t('device')}</span><strong id="backend-device">--</strong></div><div><span data-i18n="address">${t('address')}</span><strong id="backend-address">${location.host}</strong></div><div><span data-i18n="endpoint">${t('endpoint')}</span><strong>/api/infer</strong></div></div></div></section>
        <section class="panel dataset-maintenance-panel"><div class="panel-head compact-head"><div><span class="section-kicker">${icon('database')} DATASET MAINTENANCE</span><h2 data-i18n="datasetMaintenance">${t('datasetMaintenance')}</h2></div><span class="dataset-count" id="dataset-count">${t('datasetCount', { count: 0 })}</span></div><div class="dataset-maintenance-body"><div class="dataset-controls"><label for="dataset-name" data-i18n="datasetName">${t('datasetName')}</label><input id="dataset-name" type="text" maxlength="120" placeholder="${t('datasetNamePlaceholder')}" aria-label="${t('datasetName')}"><input id="dataset-file" type="file" accept=".zip,application/zip" hidden><button type="button" class="secondary-button compact" id="choose-dataset">${icon('upload')}<span data-i18n="chooseDataset">${t('chooseDataset')}</span></button><button type="button" class="secondary-button compact dataset-import-button" id="import-dataset" disabled>${icon('database')}<span data-i18n="importDataset">${t('importDataset')}</span></button><button type="button" class="device-refresh" id="refresh-datasets" title="${t('refreshDatasets')}">${icon('refresh')}</button></div><div class="dataset-selected" id="dataset-selected">${t('datasetIdle')}</div><div class="dataset-registry"><span data-i18n="datasetRegistry">${t('datasetRegistry')}</span><strong id="dataset-registry-path">--</strong></div><div class="dataset-list" id="dataset-list"><span>${t('noDatasets')}</span></div><div class="logging-status" id="dataset-status">${t('datasetIdle')}</div></div></section>
      </main>
    </div>`
  bindEvents()
  applyTheme(state.theme)
  renderTargetCapabilities()
  refreshCameraDevices()
  initializeLogging()
  loadDatasets()
  pollHealth()
}

function setText(id, value) { const element = document.querySelector(`#${id}`); if (element) element.textContent = value }
function setHtml(id, value) { const element = document.querySelector(`#${id}`); if (element) element.innerHTML = value }
function setCameraMessage(titleKey, detailKey) {
  state.cameraMessage = { titleKey, detailKey }
  const empty = document.querySelector('#camera-empty')
  if (!empty) return
  empty.innerHTML = `${icon('video')}<strong>${t(titleKey)}</strong><span>${t(detailKey)}</span>`
  empty.hidden = false
}
function hideCameraMessage() { const empty = document.querySelector('#camera-empty'); if (empty) empty.hidden = true }
function setLiveStatus(key, tone = 'muted') { setHtml('live-state', `${dot(tone)}${t(key)}`) }

function applyHealth(data) {
  state.health = data
  state.modelClasses = data.classes || []
  renderTargetCapabilities()
  setText('worker-state', t('ready'))
  setText('worker-note', t('modelLoaded', { model: data.model }))
  const device = data.cuda ? `CUDA:${data.device}` : String(data.device).toUpperCase()
  setText('device-value', device)
  setText('backend-device', device.replace(':', ' '))
  setText('input-size', `${data.imgsz || CAMERA_MAX_DIMENSION}px`)
  setText('service-label', t('modelReady'))
  setHtml('model-ready', `${dot()}<span>${t('ready')}</span>`)
  setHtml('backend-status', `${dot()}<span>${t('healthy')}</span>`)
  const progress = document.querySelector('#worker-progress')
  if (progress) progress.style.width = '100%'
}

async function pollHealth() {
  try {
    const response = await fetch('/api/health', { cache: 'no-store' })
    if (!response.ok) throw new Error('not ready')
    applyHealth(await response.json())
  } catch (_) {
    setText('worker-state', t('loading'))
    setText('worker-note', t('firstLoad'))
    setText('service-label', t('waitingLocalService'))
    window.setTimeout(pollHealth, 1500)
  }
}

function getVideo() { return document.querySelector('#camera-video') }
function getOverlay() { return document.querySelector('#detection-canvas') }
function getCapture() { return document.querySelector('#capture-canvas') }

function cameraName(device, index = 0) {
  return device?.label || t('cameraNumber', { count: index + 1 })
}

function renderCameraDevices() {
  const select = document.querySelector('#camera-device-select')
  if (!select) return
  const selectedExists = state.videoDevices.some((device) => device.deviceId === state.selectedDeviceId)
  const emptyLabel = state.videoDevices.length ? t('automaticCamera') : t('noCameraFound')
  const automaticOption = document.createElement('option')
  automaticOption.value = ''
  automaticOption.textContent = emptyLabel
  const deviceOptions = state.videoDevices.map((device, index) => {
    const option = document.createElement('option')
    option.value = device.deviceId
    option.textContent = cameraName(device, index)
    return option
  })
  select.replaceChildren(automaticOption, ...deviceOptions)
  select.value = !state.cameraSelectionIsAutomatic && selectedExists ? state.selectedDeviceId : ''
  select.disabled = !navigator.mediaDevices?.enumerateDevices
  select.setAttribute('aria-label', t('cameraDevice'))
  const refresh = document.querySelector('#refresh-camera-devices')
  if (refresh) refresh.title = t('refreshDevices')
}

async function refreshCameraDevices() {
  if (!navigator.mediaDevices?.enumerateDevices) { renderCameraDevices(); return [] }
  try {
    const devices = await navigator.mediaDevices.enumerateDevices()
    state.videoDevices = devices.filter((device) => device.kind === 'videoinput')
    if (state.selectedDeviceId && !state.videoDevices.some((device) => device.deviceId === state.selectedDeviceId)) {
      state.selectedDeviceId = ''
      state.cameraSelectionIsAutomatic = true
      try { localStorage.removeItem('ppe-camera-device') } catch (_) {}
    }
  } catch (_) {
    state.videoDevices = []
  }
  renderCameraDevices()
  return state.videoDevices
}

function preferredBuiltInCamera(devices) {
  const ranked = devices.map((device, index) => {
    const name = cameraName(device, index).toLowerCase()
    let score = 0
    if (/integrated|built[ -]?in|internal|内置|facetime|laptop|notebook/.test(name)) score += 100
    if (/\bhp\b|lenovo|dell|asus|acer|surface/.test(name)) score += 35
    if (/iphone|continuity|android|phone|mobile|droid|camo|epoccam|iriun/.test(name)) score -= 100
    if (/virtual|obs/.test(name)) score -= 50
    return { device, score }
  }).sort((left, right) => right.score - left.score)
  return ranked[0]?.score > 0 ? ranked[0].device : null
}

function cameraConstraints(deviceId = '') {
  const video = { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } }
  if (deviceId) video.deviceId = { exact: deviceId }
  else video.facingMode = { ideal: 'user' }
  return { video, audio: false }
}

async function attachCameraStream(stream) {
  const previous = state.stream
  const video = getVideo()
  state.stream = stream
  video.srcObject = stream
  await video.play()
  previous?.getTracks().forEach((track) => track.stop())
  setText('camera-resolution', `${video.videoWidth} x ${video.videoHeight}`)
  setText('resolution-summary', `${video.videoWidth} x ${video.videoHeight}`)
}

async function selectPreferredCamera(stream) {
  const devices = await refreshCameraDevices()
  if (!state.cameraSelectionIsAutomatic || state.selectedDeviceId) return stream
  const preferred = preferredBuiltInCamera(devices)
  const currentId = stream.getVideoTracks()[0]?.getSettings().deviceId || ''
  if (!preferred) return stream
  state.selectedDeviceId = preferred.deviceId
  renderCameraDevices()
  setText('source-name', t('cameraAutoSelected', { name: cameraName(preferred) }))
  if (preferred.deviceId === currentId) return stream
  const preferredStream = await navigator.mediaDevices.getUserMedia(cameraConstraints(preferred.deviceId))
  stream.getTracks().forEach((track) => track.stop())
  return preferredStream
}

async function switchCameraDevice(deviceId) {
  state.selectedDeviceId = deviceId || ''
  state.cameraSelectionIsAutomatic = !deviceId
  try {
    if (deviceId) localStorage.setItem('ppe-camera-device', deviceId)
    else localStorage.removeItem('ppe-camera-device')
  } catch (_) {}
  renderCameraDevices()
  if (!state.stream) return
  const wasRunning = state.running
  state.running = false
  if (state.timer) { window.clearTimeout(state.timer); state.timer = null }
  setText('permission-note', t('switchingCamera'))
  try {
    let stream = await navigator.mediaDevices.getUserMedia(cameraConstraints(state.selectedDeviceId))
    if (!state.selectedDeviceId) stream = await selectPreferredCamera(stream)
    await attachCameraStream(stream)
    const activeId = stream.getVideoTracks()[0]?.getSettings().deviceId || state.selectedDeviceId
    const active = state.videoDevices.find((device) => device.deviceId === activeId)
    state.permissionState = 'permissionGranted'
    setText('permission-note', t('permissionGranted'))
    setText('source-name', t('cameraSelected', { name: cameraName(active) }))
    state.running = wasRunning
    if (wasRunning) startInferenceLoop()
    updateCameraButton()
  } catch (_) {
    state.running = wasRunning
    setText('permission-note', t('cameraUnavailable'))
    setLiveStatus('cameraError', 'amber')
    if (wasRunning) startInferenceLoop()
  }
}

async function startCamera() {
  if (!navigator.mediaDevices?.getUserMedia) {
    setCameraMessage('browserUnsupported', 'browserUnsupportedDetail')
    return
  }
  if (state.source !== 'camera') clearImageMode()
  const preview = document.querySelector('#image-preview')
  const video = getVideo()
  if (preview) preview.hidden = true
  if (video) video.hidden = false
  state.permissionState = 'permissionRequesting'
  setCameraMessage('requestingPermission', 'allowPermission')
  setText('permission-note', t('permissionRequesting'))
  try {
    let stream = await navigator.mediaDevices.getUserMedia(cameraConstraints(state.selectedDeviceId))
    if (!state.selectedDeviceId) stream = await selectPreferredCamera(stream)
    await attachCameraStream(stream)
    await refreshCameraDevices()
    state.source = 'camera'
    state.running = true
    state.error = ''
    state.rawDetections = []
    state.detections = []
    state.permissionState = 'permissionGranted'
    hideCameraMessage()
    setText('permission-note', t('permissionGranted'))
    const activeId = state.stream.getVideoTracks()[0]?.getSettings().deviceId || state.selectedDeviceId
    const active = state.videoDevices.find((device) => device.deviceId === activeId)
    setText('source-name', active ? t('cameraSelected', { name: cameraName(active) }) : t('localCamera'))
    setText('stream-label', 'LOCAL CAMERA')
    setLiveStatus('live', 'green')
    setHeaderState('dataRunning', 'green')
    updateCameraButton()
    startInferenceLoop()
  } catch (error) {
    state.permissionState = error.name === 'NotAllowedError' ? 'permissionDenied' : 'cameraUnavailable'
    state.error = t(state.permissionState)
    setCameraMessage(state.permissionState, 'cameraUnavailableDetail')
    setText('permission-note', state.error)
    setLiveStatus('cameraError', 'amber')
  }
}

function setHeaderState(key, tone = 'muted') { setHtml('header-state', `${dot(tone)}<span>${t(key)}</span>`) }

function updateCameraButton() {
  const button = document.querySelector('#camera-toggle')
  if (!button) return
  button.innerHTML = icon(state.running ? 'pause' : 'play')
  button.title = t(state.running ? 'pauseDetection' : (state.stream ? 'resumeDetection' : 'startCamera'))
}

function resumeInference() {
  if (!state.stream) { startCamera(); return }
  state.running = true
  getVideo()?.play().catch(() => {})
  setLiveStatus('live', 'green')
  setHeaderState('dataRunning', 'green')
  updateCameraButton()
  startInferenceLoop()
}

function stopInference() {
  state.running = false
  if (state.timer) { window.clearTimeout(state.timer); state.timer = null }
  setLiveStatus('paused', 'muted')
  updateCameraButton()
}

function stopCamera() {
  stopInference()
  state.stream?.getTracks().forEach((track) => track.stop())
  state.stream = null
  const video = getVideo()
  if (video) video.srcObject = null
  updateCameraButton()
}

function scheduleNextInference(delay = 0) {
  if (!state.running || state.source !== 'camera') return
  if (state.timer) window.clearTimeout(state.timer)
  state.timer = window.setTimeout(runInference, delay)
}

function startInferenceLoop() {
  if (state.timer) window.clearTimeout(state.timer)
  state.timer = null
  runInference()
}

function getActiveClassIds() {
  if (!state.modelClasses.length) return []
  const allowed = new Set(['Person'])
  TARGETS.forEach((target) => {
    if (state.enabledTargets.has(target.key)) target.classNames.forEach((name) => allowed.add(name))
  })
  return state.modelClasses.reduce((ids, name, index) => { if (allowed.has(name)) ids.push(index); return ids }, [])
}

function inferenceHeaders(contentType = 'image/jpeg') {
  const headers = { 'Content-Type': contentType, 'X-PPE-Confidence': state.confidence.toFixed(2), 'X-PPE-IoU': '0.70' }
  const classIds = getActiveClassIds()
  if (classIds.length) headers['X-PPE-Classes'] = classIds.join(',')
  return headers
}

async function runInference() {
  const video = getVideo()
  if (!state.running || state.source !== 'camera') return
  if (state.processing) { scheduleNextInference(10); return }
  if (!video || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA || !video.videoWidth || !video.videoHeight) { scheduleNextInference(40); return }
  state.processing = true
  const cycleStarted = performance.now()
  try {
    const capture = getCapture()
    const scale = Math.min(1, CAMERA_MAX_DIMENSION / Math.max(video.videoWidth, video.videoHeight))
    capture.width = Math.max(2, Math.round(video.videoWidth * scale))
    capture.height = Math.max(2, Math.round(video.videoHeight * scale))
    capture.getContext('2d', { alpha: false }).drawImage(video, 0, 0, capture.width, capture.height)
    const blob = await new Promise((resolve) => capture.toBlob(resolve, 'image/jpeg', CAMERA_JPEG_QUALITY))
    if (!blob) throw new Error('Unable to encode camera frame')
    const response = await fetch('/api/infer', { method: 'POST', body: blob, headers: inferenceHeaders() })
    if (!response.ok) throw new Error((await response.json().catch(() => ({}))).error || t('inferenceUnavailable'))
    const data = await response.json()
    data.total_ms = performance.now() - cycleStarted
    updateResults(data)
  } catch (error) {
    setText('inference-status', error.message || t('inferenceFailed'))
    setLiveStatus('inferenceRetrying', 'amber')
  } finally {
    state.processing = false
    scheduleNextInference(0)
  }
}

function detectionColor(name) {
  if (isViolation(name)) return '#f26e62'
  if (name === 'Person') return '#68b9ff'
  if (/vest/i.test(name)) return '#d2f15a'
  if (/hardhat|goggle/i.test(name)) return '#f2ad61'
  if (/coverall/i.test(name)) return '#70d3b0'
  if (/ear|muff/i.test(name)) return '#68b9ff'
  return '#b69cff'
}

function isDetectionEnabled(name) {
  if (name === 'Person') return true
  const target = TARGETS.find((candidate) => candidate.classNames.includes(name))
  return Boolean(target && state.enabledTargets.has(target.key))
}

function filterDetections() {
  state.detections = state.rawDetections.filter((item) => isDetectionEnabled(item.label))
}

function renderDetectionBoxes(rect, width, height) {
  const boxes = document.querySelector('#detection-boxes')
  if (!boxes || !width || !height) return
  const scale = Math.min(rect.width / width, rect.height / height)
  const offsetX = (rect.width - width * scale) / 2
  const offsetY = (rect.height - height * scale) / 2
  boxes.innerHTML = state.detections.map((item) => {
    const [x1, y1, x2, y2] = item.xyxy
    const left = offsetX + x1 * scale
    const top = offsetY + y1 * scale
    const boxWidth = Math.max(1, (x2 - x1) * scale)
    const boxHeight = Math.max(1, (y2 - y1) * scale)
    const color = detectionColor(item.label)
    return `<div class="detection-box" style="left:${left}px;top:${top}px;width:${boxWidth}px;height:${boxHeight}px;--box-color:${color}"><span>${label(item.label)} ${(item.confidence * 100).toFixed(0)}%</span></div>`
  }).join('')
}

function drawDetections(width, height) {
  const canvas = getOverlay()
  const stage = document.querySelector('#camera-stage')
  if (!canvas || !stage) return
  const rect = stage.getBoundingClientRect()
  canvas.width = Math.max(1, Math.round(rect.width))
  canvas.height = Math.max(1, Math.round(rect.height))
  canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)
  const boxes = document.querySelector('#detection-boxes')
  if (!width || !height) { if (boxes) boxes.innerHTML = ''; return }
  renderDetectionBoxes(rect, width, height)
}

function localLogFileName(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `ppe-detections-${year}-${month}-${day}.jsonl`
}

function setLogStatus(key, values = {}) {
  state.logStatusKey = key
  state.logStatusValues = values
  setText('logging-status', t(key, values))
}

function renderLoggingSettings() {
  const toggle = document.querySelector('#logging-toggle')
  if (toggle) {
    toggle.setAttribute('aria-pressed', String(state.loggingEnabled))
    toggle.classList.toggle('is-enabled', state.loggingEnabled)
  }
  setText('logging-toggle-state', t(state.loggingEnabled ? 'loggingOn' : 'loggingOff'))
  const destination = document.querySelector('#log-destination')
  if (destination) {
    destination.value = state.logDestination
    destination.setAttribute('aria-label', t('logDestination'))
    destination.options[0].textContent = t('defaultLogPath')
    destination.options[1].textContent = t('customLogFolder')
  }
  const chooseButton = document.querySelector('#choose-log-folder')
  const folderPickerSupported = !state.forceManualLogPath && typeof window.showDirectoryPicker === 'function'
  if (chooseButton) {
    chooseButton.hidden = state.logDestination !== 'custom' || !folderPickerSupported
    const text = chooseButton.querySelector('span')
    if (text) text.textContent = t(state.logDirectoryHandle ? 'chooseAgain' : 'chooseFolder')
  }
  const manualDirectory = document.querySelector('#manual-log-directory')
  if (manualDirectory) manualDirectory.hidden = state.logDestination !== 'custom' || folderPickerSupported
  const manualInput = document.querySelector('#manual-log-path')
  if (manualInput) {
    manualInput.placeholder = t('enterFolderPath')
    manualInput.setAttribute('aria-label', t('enterFolderPath'))
    if (state.logServerDirectory && document.activeElement !== manualInput) manualInput.value = state.logServerDirectory
  }
  const fileName = localLogFileName()
  if (state.logDestination === 'custom') {
    if (state.logDirectoryHandle) setText('log-path', `${state.logDirectoryHandle.name} / ${fileName}`)
    else if (state.logServerDirectory) setText('log-path', `${state.logServerDirectory}\\${fileName}`)
    else setText('log-path', t('customFolderRequired'))
  } else {
    setText('log-path', state.logDefaultDirectory ? `${state.logDefaultDirectory}\\${fileName}` : t('logDefaultPending'))
  }
  setText('logging-status', t(state.logStatusKey, state.logStatusValues))
}

async function initializeLogging() {
  if (state.logDestination === 'custom' && !state.logDirectoryHandle) setLogStatus('customFolderRequired')
  renderLoggingSettings()
  try {
    const response = await fetch('/api/log-config', { cache: 'no-store' })
    if (!response.ok) throw new Error('log config unavailable')
    const data = await response.json()
    state.logDefaultDirectory = data.default_directory || 'logs'
    state.logServerDirectory = data.custom_directory || state.logServerDirectory
  } catch (_) {
    state.logDefaultDirectory = 'logs'
  }
  renderLoggingSettings()
}

async function chooseLogDirectory() {
  if (state.forceManualLogPath || typeof window.showDirectoryPicker !== 'function') {
    state.logDirectoryHandle = null
    state.forceManualLogPath = true
    setLogStatus('folderUnsupported')
    renderLoggingSettings()
    return Boolean(state.logServerDirectory)
  }
  try {
    state.logDirectoryHandle = await window.showDirectoryPicker({ mode: 'readwrite' })
    state.logDestination = 'custom'
    try { localStorage.setItem('ppe-log-destination', 'custom') } catch (_) {}
    setLogStatus('folderSelected', { name: state.logDirectoryHandle.name })
    renderLoggingSettings()
    return true
  } catch (error) {
    if (error.name === 'AbortError') {
      setLogStatus('customFolderRequired')
    } else {
      state.logDirectoryHandle = null
      state.forceManualLogPath = true
      setLogStatus('folderUnsupported')
    }
    renderLoggingSettings()
    return Boolean(state.logServerDirectory)
  }
}

async function toggleLogging() {
  const enable = !state.loggingEnabled
  if (enable && state.logDestination === 'custom' && !state.logDirectoryHandle && !state.logServerDirectory) {
    const selected = await chooseLogDirectory()
    if (!selected) return
  }
  state.loggingEnabled = enable
  try { localStorage.setItem('ppe-logging-enabled', String(enable)) } catch (_) {}
  setLogStatus(enable ? 'loggingReady' : 'loggingInactive')
  renderLoggingSettings()
}

async function changeLogDestination(destination) {
  state.logDestination = destination === 'custom' ? 'custom' : 'default'
  try { localStorage.setItem('ppe-log-destination', state.logDestination) } catch (_) {}
  if (state.logDestination === 'custom' && !state.logDirectoryHandle && !state.logServerDirectory) {
    const selected = await chooseLogDirectory()
    if (!selected && state.loggingEnabled) {
      state.loggingEnabled = false
      try { localStorage.setItem('ppe-logging-enabled', 'false') } catch (_) {}
    }
  } else {
    setLogStatus(state.loggingEnabled ? 'loggingReady' : 'loggingInactive')
  }
  renderLoggingSettings()
}

async function applyManualLogDirectory() {
  const input = document.querySelector('#manual-log-path')
  const directory = input?.value.trim() || ''
  if (!directory) { setLogStatus('customFolderRequired'); renderLoggingSettings(); return }
  try {
    const response = await fetch('/api/log-config', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ directory }) })
    if (!response.ok) throw new Error('Invalid log directory')
    const result = await response.json()
    state.logServerDirectory = result.custom_directory || directory
    state.logDestination = 'custom'
    try { localStorage.setItem('ppe-log-destination', 'custom') } catch (_) {}
    setLogStatus('customPathSaved', { name: state.logServerDirectory })
  } catch (_) {
    setLogStatus('invalidFolderPath')
  }
  renderLoggingSettings()
}

async function writeCustomLog(entry) {
  if (!state.logDirectoryHandle) throw new Error('Custom log folder is not selected')
  const fileName = localLogFileName()
  const fileHandle = await state.logDirectoryHandle.getFileHandle(fileName, { create: true })
  const currentFile = await fileHandle.getFile()
  const writable = await fileHandle.createWritable({ keepExistingData: true })
  await writable.seek(currentFile.size)
  await writable.write(`${JSON.stringify({ ...entry, stored_at: new Date().toISOString() })}\n`)
  await writable.close()
  return fileName
}

async function writeDefaultLog(entry, useCustomDirectory = false) {
  const headers = { 'Content-Type': 'application/json' }
  if (useCustomDirectory) headers['X-PPE-Log-Destination'] = 'custom'
  const response = await fetch('/api/logs', { method: 'POST', headers, body: JSON.stringify(entry) })
  if (!response.ok) throw new Error('Default log write failed')
  const result = await response.json()
  const writtenDirectory = result.path ? result.path.slice(0, Math.max(result.path.lastIndexOf('\\'), result.path.lastIndexOf('/'))) : ''
  if (writtenDirectory) {
    if (useCustomDirectory) state.logServerDirectory = writtenDirectory
    else state.logDefaultDirectory = writtenDirectory
  }
  return result.file || localLogFileName()
}

function queueDetectionLog(data) {
  if (!state.loggingEnabled || !state.detections.length) return
  const now = Date.now()
  if (now - state.logLastAt < 1000) return
  state.logLastAt = now
  const entry = {
    timestamp: new Date(now).toISOString(),
    source: state.source,
    confidence_threshold: state.confidence,
    inference_ms: Number(data.inference_ms) || 0,
    total_ms: Number(data.total_ms) || Number(data.inference_ms) || 0,
    frame: { width: data.width || 0, height: data.height || 0 },
    enabled_targets: [...state.enabledTargets],
    detections: state.detections.map((item) => ({ class_id: item.class_id, label: item.label, confidence: item.confidence, xyxy: item.xyxy })),
  }
  state.logQueue = state.logQueue.catch(() => {}).then(async () => {
    let fileName
    if (state.logDestination === 'custom' && state.logDirectoryHandle) fileName = await writeCustomLog(entry)
    else if (state.logDestination === 'custom' && state.logServerDirectory) fileName = await writeDefaultLog(entry, true)
    else fileName = await writeDefaultLog(entry)
    state.logLastFile = fileName
    setLogStatus('loggingSaved', { file: fileName })
    renderLoggingSettings()
  }).catch(() => {
    setLogStatus(state.logDestination === 'custom' && !state.logDirectoryHandle ? 'customFolderRequired' : 'logWriteFailed')
    renderLoggingSettings()
  })
}

function datasetImageCount(dataset) {
  return Object.values(dataset.splits || {}).reduce((total, split) => total + (Number(split.images) || 0), 0)
}

function setDatasetStatus(key, values = {}) {
  state.datasetStatusKey = key
  state.datasetStatusValues = values
  setText('dataset-status', t(key, values))
}

function renderDatasetMaintenance() {
  setText('dataset-count', t('datasetCount', { count: state.datasets.length }))
  setText('dataset-registry-path', state.datasetRegistry || '--')
  setText('dataset-selected', state.datasetFile ? t('datasetReady', { name: state.datasetFile.name }) : t('datasetIdle'))
  setText('dataset-status', t(state.datasetStatusKey, state.datasetStatusValues))
  const nameInput = document.querySelector('#dataset-name')
  if (nameInput) {
    nameInput.placeholder = t('datasetNamePlaceholder')
    nameInput.setAttribute('aria-label', t('datasetName'))
    nameInput.disabled = state.datasetImporting
  }
  const importButton = document.querySelector('#import-dataset')
  if (importButton) importButton.disabled = state.datasetImporting || !state.datasetFile || !nameInput?.value.trim()
  const chooseButton = document.querySelector('#choose-dataset')
  if (chooseButton) chooseButton.disabled = state.datasetImporting
  const refreshButton = document.querySelector('#refresh-datasets')
  if (refreshButton) {
    refreshButton.disabled = state.datasetImporting
    refreshButton.title = t('refreshDatasets')
  }
  const list = document.querySelector('#dataset-list')
  if (!list) return
  list.replaceChildren()
  if (!state.datasets.length) {
    const empty = document.createElement('span')
    empty.textContent = t('noDatasets')
    list.append(empty)
    return
  }
  state.datasets.forEach((dataset) => {
    const row = document.createElement('div')
    row.className = 'dataset-row'
    const name = document.createElement('strong')
    name.textContent = dataset.name
    const meta = document.createElement('span')
    const classCount = Number(dataset.class_count) || (Array.isArray(dataset.classes) ? dataset.classes.length : 0)
    meta.textContent = `${t('datasetClasses', { count: classCount })} · ${t('datasetImages', { count: datasetImageCount(dataset) })}`
    row.append(name, meta)
    list.append(row)
  })
}

async function loadDatasets() {
  try {
    const response = await fetch('/api/maintenance/datasets', { cache: 'no-store' })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const data = await response.json()
    state.datasets = Array.isArray(data.datasets) ? data.datasets : []
    state.datasetRegistry = data.registry_directory || ''
  } catch (error) {
    setDatasetStatus('datasetImportFailed', { message: error.message })
  }
  renderDatasetMaintenance()
}

function selectDatasetFile(file) {
  if (!file || !file.name.toLowerCase().endsWith('.zip')) {
    state.datasetFile = null
    setDatasetStatus('datasetZipRequired')
    renderDatasetMaintenance()
    return
  }
  state.datasetFile = file
  const nameInput = document.querySelector('#dataset-name')
  if (nameInput && !nameInput.value.trim()) nameInput.value = file.name.replace(/\.zip$/i, '')
  setDatasetStatus('datasetReady', { name: file.name })
  renderDatasetMaintenance()
}

async function importDataset() {
  const nameInput = document.querySelector('#dataset-name')
  const datasetName = nameInput?.value.trim() || ''
  if (!state.datasetFile || !datasetName) { setDatasetStatus('datasetZipRequired'); renderDatasetMaintenance(); return }
  state.datasetImporting = true
  setDatasetStatus('datasetUploading')
  renderDatasetMaintenance()
  try {
    const response = await fetch(`/api/maintenance/datasets/import?name=${encodeURIComponent(datasetName)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/zip' },
      body: state.datasetFile,
    })
    const result = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(result.error || `HTTP ${response.status}`)
    state.datasetFile = null
    const fileInput = document.querySelector('#dataset-file')
    if (fileInput) fileInput.value = ''
    if (nameInput) nameInput.value = ''
    setDatasetStatus('datasetImported', { name: result.dataset?.name || datasetName })
    await loadDatasets()
  } catch (error) {
    setDatasetStatus('datasetImportFailed', { message: error.message })
  } finally {
    state.datasetImporting = false
    renderDatasetMaintenance()
  }
}

function updateResults(data) {
  state.rawDetections = data.detections || []
  state.inferenceMs = Number(data.inference_ms) || 0
  state.totalMs = Number(data.total_ms) || state.inferenceMs
  state.frameWidth = data.width || 0
  state.frameHeight = data.height || 0
  filterDetections()
  refreshResults()
  queueDetectionLog(data)
}

function refreshResults() {
  const people = state.detections.filter((item) => item.label === 'Person').length
  const violations = state.detections.filter((item) => isViolation(item.label)).length
  setText('people-count', String(people))
  setText('detection-count', String(state.detections.length))
  setText('violation-count', String(violations))
  setText('detection-badge', t('items', { count: state.detections.length }))
  const modelTiming = `${state.inferenceMs.toFixed(1)} ms`
  const totalTiming = `${state.totalMs.toFixed(0)} ms`
  setText('latency-summary', totalTiming)
  setText('model-latency', modelTiming)
  setText('inference-status', t('latencyStatus', { total: totalTiming, model: modelTiming }))
  setText('camera-result-badge', `YOLO26 · ${t('targetsBadge', { count: state.detections.length })} · ${totalTiming}`)
  const bar = document.querySelector('#latency-bar')
  if (bar) bar.style.width = `${Math.min(100, Math.max(8, state.inferenceMs / 2))}%`
  setLiveStatus('live', 'green')
  setText('stream-fps', t('fps', { value: (1000 / Math.max(1, state.totalMs)).toFixed(1) }))
  drawDetections(state.frameWidth, state.frameHeight)
  renderDetectionList()
}

function renderDetectionList() {
  const container = document.querySelector('#detection-list')
  if (!container) return
  if (!state.detections.length) {
    container.innerHTML = `<div class="empty-detections">${t(state.inferenceMs === null ? 'startCameraResults' : 'noDetections')}</div>`
    return
  }
  container.innerHTML = state.detections.slice(0, 6).map((item) => {
    const bad = isViolation(item.label)
    return `<div class="finding-row ${bad ? 'warning' : ''}"><div class="finding-avatar" style="color:${detectionColor(item.label)}">${icon(bad ? 'alert' : 'shield')}</div><div class="finding-content"><div class="finding-title"><strong>${label(item.label)}</strong><span>${(item.confidence * 100).toFixed(1)}%</span></div><span class="finding-role">x:${item.xyxy[0].toFixed(0)} y:${item.xyxy[1].toFixed(0)}</span><div class="finding-tags"><span class="${bad ? 'bad' : ''}">${t(bad ? 'needsAttention' : 'ppeDetected')}</span></div></div><span class="finding-indicator">${dot(bad ? 'amber' : 'green')}</span></div>`
  }).join('')
}

function toggleTarget(key) {
  if (!TARGET_KEYS.includes(key)) return
  if (state.enabledTargets.has(key)) state.enabledTargets.delete(key)
  else state.enabledTargets.add(key)
  try { localStorage.setItem('ppe-enabled-targets', JSON.stringify([...state.enabledTargets])) } catch (_) {}
  filterDetections()
  renderTargetCapabilities()
  if (state.inferenceMs !== null) refreshResults()
  else { drawDetections(state.frameWidth, state.frameHeight); renderDetectionList() }
}

function clearOverlay() {
  const canvas = getOverlay()
  if (canvas) canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)
  const boxes = document.querySelector('#detection-boxes')
  if (boxes) boxes.innerHTML = ''
}

function clearResults() {
  state.rawDetections = []
  state.detections = []
  state.inferenceMs = null
  state.totalMs = null
  state.frameWidth = 0
  state.frameHeight = 0
  clearOverlay()
  renderDetectionList()
  setText('people-count', '--')
  setText('detection-count', '--')
  setText('violation-count', '--')
  setText('detection-badge', '--')
  setText('latency-summary', '--')
  setText('model-latency', '--')
  setText('camera-result-badge', `YOLO26 · ${t('waitingNextFrame')}`)
}

function clearImageMode() {
  const preview = document.querySelector('#image-preview')
  if (state.lastImageUrl) URL.revokeObjectURL(state.lastImageUrl)
  state.lastImageUrl = ''
  if (preview) { preview.hidden = true; preview.removeAttribute('src') }
}

async function inspectImage(file) {
  stopCamera()
  clearResults()
  state.source = 'image'
  const video = getVideo()
  video.hidden = true
  const preview = document.querySelector('#image-preview')
  clearImageMode()
  state.lastImageUrl = URL.createObjectURL(file)
  preview.src = state.lastImageUrl
  preview.hidden = false
  await preview.decode().catch(() => {})
  hideCameraMessage()
  setText('source-name', file.name)
  setText('stream-label', 'UPLOADED IMAGE')
  setText('camera-resolution', `${preview.naturalWidth} x ${preview.naturalHeight}`)
  setText('resolution-summary', `${preview.naturalWidth} x ${preview.naturalHeight}`)
  setLiveStatus('analyzing', 'green')
  const started = performance.now()
  try {
    const response = await fetch('/api/infer', { method: 'POST', body: file, headers: inferenceHeaders(file.type || 'image/jpeg') })
    if (!response.ok) throw new Error((await response.json().catch(() => ({}))).error || t('detectionFailed'))
    const data = await response.json()
    data.total_ms = performance.now() - started
    updateResults(data)
  } catch (error) {
    setCameraMessage('imageFailed', 'retry')
    setText('inference-status', error.message || t('detectionFailed'))
    setLiveStatus('inferenceError', 'amber')
  }
}

function applyLanguage(language) {
  state.language = language === 'en' ? 'en' : 'zh'
  try { localStorage.setItem('ppe-language', state.language) } catch (_) {}
  document.documentElement.lang = state.language === 'zh' ? 'zh-CN' : 'en'
  document.querySelectorAll('[data-i18n]').forEach((element) => { element.textContent = t(element.dataset.i18n) })
  document.querySelectorAll('[data-lang]').forEach((button) => {
    const active = button.dataset.lang === state.language
    button.setAttribute('aria-pressed', String(active))
    button.classList.toggle('selected', active)
  })
  document.querySelector('.language-switch')?.setAttribute('aria-label', t('language'))
  document.querySelector('.theme-switch')?.setAttribute('aria-label', t('theme'))
  document.querySelector('#camera-video')?.setAttribute('aria-label', t('camera'))
  document.querySelector('#image-preview')?.setAttribute('alt', t('uploadAlt'))
  document.querySelector('#confidence-range')?.setAttribute('aria-label', t('confidenceThreshold'))
  renderTargetCapabilities()
  renderCameraDevices()
  renderLoggingSettings()
  renderDatasetMaintenance()
  if (state.health) applyHealth(state.health)
  setText('permission-note', t(state.permissionState))
  if (state.source === 'camera') {
    const activeId = state.stream?.getVideoTracks()[0]?.getSettings().deviceId || state.selectedDeviceId
    const active = state.videoDevices.find((device) => device.deviceId === activeId)
    setText('source-name', active ? t('cameraSelected', { name: cameraName(active) }) : t('localCamera'))
  }
  updateCameraButton()
  if (!document.querySelector('#camera-empty')?.hidden) setCameraMessage(state.cameraMessage.titleKey, state.cameraMessage.detailKey)
  if (state.inferenceMs !== null) refreshResults()
  else {
    renderDetectionList()
    setText('camera-result-badge', `YOLO26 · ${t('waitingFirstFrame')}`)
    setText('inference-status', t('waitingStart'))
    if (!state.stream && state.source === 'camera') setText('camera-resolution', t('waitingInput'))
  }
  if (state.running) setHeaderState('dataRunning', 'green')
  else if (!state.stream) setHeaderState('waitingCamera', 'muted')
  if (state.running) setLiveStatus('live', 'green')
  else if (state.stream) setLiveStatus('paused', 'muted')
  else if (state.source === 'camera') setLiveStatus('idle', 'muted')
}

function applyTheme(theme) {
  state.theme = theme === 'light' ? 'light' : 'dark'
  try { localStorage.setItem('ppe-theme', state.theme) } catch (_) {}
  document.documentElement.dataset.theme = state.theme
  document.querySelectorAll('[data-theme-value]').forEach((button) => {
    const active = button.dataset.themeValue === state.theme
    button.setAttribute('aria-pressed', String(active))
    button.classList.toggle('selected', active)
  })
}

function bindEvents() {
  document.querySelector('#camera-toggle').addEventListener('click', () => state.running ? stopInference() : (state.stream ? resumeInference() : startCamera()))
  document.querySelector('#camera-source').addEventListener('click', () => {
    document.querySelector('#camera-source').classList.add('selected')
    document.querySelector('#upload-source').classList.remove('selected')
    state.stream ? resumeInference() : startCamera()
  })
  document.querySelector('#upload-source').addEventListener('click', () => document.querySelector('#upload-file').click())
  document.querySelector('#camera-device-select').addEventListener('change', (event) => switchCameraDevice(event.target.value))
  document.querySelector('#refresh-camera-devices').addEventListener('click', refreshCameraDevices)
  document.querySelector('#upload-file').addEventListener('change', (event) => {
    const file = event.target.files?.[0]
    if (file) {
      document.querySelector('#upload-source').classList.add('selected')
      document.querySelector('#camera-source').classList.remove('selected')
      inspectImage(file)
    }
  })
  document.querySelector('#clear-button').addEventListener('click', () => {
    clearResults()
    if (state.source === 'camera') setLiveStatus(state.running ? 'live' : 'paused', state.running ? 'green' : 'muted')
  })
  document.querySelector('#confidence-range').addEventListener('input', (event) => {
    state.confidence = Number(event.target.value) / 100
    setText('confidence-value', `${event.target.value}%`)
    setText('threshold-summary', `${event.target.value}%`)
    setText('model-confidence', state.confidence.toFixed(2))
  })
  document.querySelectorAll('[data-lang]').forEach((button) => button.addEventListener('click', () => applyLanguage(button.dataset.lang)))
  document.querySelectorAll('[data-theme-value]').forEach((button) => button.addEventListener('click', () => applyTheme(button.dataset.themeValue)))
  document.querySelector('#logging-toggle').addEventListener('click', toggleLogging)
  document.querySelector('#log-destination').addEventListener('change', (event) => changeLogDestination(event.target.value))
  document.querySelector('#choose-log-folder').addEventListener('click', chooseLogDirectory)
  document.querySelector('#apply-log-path').addEventListener('click', applyManualLogDirectory)
  document.querySelector('#choose-dataset').addEventListener('click', () => document.querySelector('#dataset-file').click())
  document.querySelector('#dataset-file').addEventListener('change', (event) => selectDatasetFile(event.target.files?.[0]))
  document.querySelector('#dataset-name').addEventListener('input', renderDatasetMaintenance)
  document.querySelector('#import-dataset').addEventListener('click', importDataset)
  document.querySelector('#refresh-datasets').addEventListener('click', loadDatasets)
  navigator.mediaDevices?.addEventListener?.('devicechange', refreshCameraDevices)
  window.addEventListener('resize', () => drawDetections(state.frameWidth, state.frameHeight))
  window.addEventListener('beforeunload', () => { stopCamera(); clearImageMode() })
}

render()
