// ============================================================
// useSync.js — GitHub 云同步（跨设备同步进度+笔记）
// 原理：把进度/笔记打包成 data.json，通过 GitHub Contents API
//      存入私有仓库 fae-handbook-data
// 安全：Token 只保存在用户浏览器 localStorage，绝不写入代码/仓库
// ============================================================
import { ref } from 'vue'

const SYNC_TOKEN_KEY = 'fae_sync_token'
const SYNC_REPO_KEY = 'fae_sync_repo'
const DEFAULT_REPO = 'Dongjingsheng/fae-handbook-data'
const DATA_FILE = 'data.json'
const API = 'https://api.github.com'

export const syncState = ref({
  configured: !!localStorage.getItem(SYNC_TOKEN_KEY),
  syncing: false,
  lastSync: localStorage.getItem('fae_sync_last') || '',
  error: ''
})

function getToken() { return localStorage.getItem(SYNC_TOKEN_KEY) || '' }
function getRepo() { return localStorage.getItem(SYNC_REPO_KEY) || DEFAULT_REPO }
export function setSyncRepo(repo) { localStorage.setItem(SYNC_REPO_KEY, repo) }

// ---------- GitHub API ----------
async function ghApi(method, path, body, token) {
  const headers = {
    'Authorization': 'token ' + token,
    'Accept': 'application/vnd.github+json',
    'Content-Type': 'application/json',
    'User-Agent': 'fae-handbook-sync'
  }
  const res = await fetch(API + path, {
    method, headers,
    body: body ? JSON.stringify(body) : undefined
  })
  if (res.status === 204) return null
  const text = await res.text()
  let data
  try { data = text ? JSON.parse(text) : null } catch { data = text }
  if (!res.ok) {
    const msg = (data && (data.message || data.errors && data.errors[0] && data.errors[0].message)) || ('HTTP ' + res.status)
    throw new Error(msg)
  }
  return data
}

function b64encode(str) {
  // 支持中文：先转 UTF-8 字节再 base64
  const bytes = new TextEncoder().encode(str)
  let bin = ''
  bytes.forEach(b => { bin += String.fromCharCode(b) })
  return btoa(bin)
}
function b64decode(b64) {
  const bin = atob(b64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return new TextDecoder('utf-8').decode(bytes)
}

// ---------- 打包/解包 ----------
export function packData(progress, notes) {
  return JSON.stringify({ version: 1, updatedAt: new Date().toISOString(), progress, notes }, null, 2)
}
export function unpackData(jsonStr) {
  const d = JSON.parse(jsonStr)
  return { progress: d.progress || {}, notes: d.notes || {} }
}

// ---------- 核心操作 ----------
/** 拉取云端数据；云端无文件返回 null */
export async function pullFromCloud() {
  const token = getToken()
  const repo = getRepo()
  const data = await ghApi('GET', `/repos/${repo}/contents/${DATA_FILE}`, null, token)
  if (!data || !data.content) return null
  return unpackData(b64decode(data.content))
}

/** 推送本地数据到云端；自动处理文件存在/不存在（sha） */
export async function pushToCloud(progress, notes) {
  const token = getToken()
  const repo = getRepo()
  let sha = null
  try {
    const existing = await ghApi('GET', `/repos/${repo}/contents/${DATA_FILE}`, null, token)
    if (existing && existing.sha) sha = existing.sha
  } catch { /* 文件不存在，sha 保持 null */ }
  const content = b64encode(packData(progress, notes))
  const body = { message: 'fae 自动同步 ' + new Date().toLocaleString('zh-CN', { hour12: false }), content }
  if (sha) body.sha = sha
  await ghApi('PUT', `/repos/${repo}/contents/${DATA_FILE}`, body, token)
}

/** 合并：云端为主，但保留本地独有的进度/笔记；同一天笔记两边都有→取云端（较新） */
export function mergeCloudIntoLocal(cloud, localProgress, localNotes) {
  const progress = { ...cloud.progress, ...localProgress }
  const notes = { ...cloud.notes }
  // 本地有天而云端没有的天 → 补上
  Object.keys(localNotes).forEach(k => { if (notes[k] === undefined) notes[k] = localNotes[k] })
  return { progress, notes }
}

/** 校验 token（轻量：查用户信息） */
export async function verifyToken() {
  const token = getToken()
  const me = await ghApi('GET', '/user', null, token)
  return me && me.login ? me.login : null
}

export function saveSyncToken(token) {
  localStorage.setItem(SYNC_TOKEN_KEY, token.trim())
  syncState.value.configured = !!token.trim()
  syncState.value.error = ''
}
export function clearSyncToken() {
  localStorage.removeItem(SYNC_TOKEN_KEY)
  localStorage.removeItem('fae_sync_last')
  syncState.value.configured = false
  syncState.value.lastSync = ''
  syncState.value.error = ''
}
export function markSynced() {
  const t = new Date().toLocaleString('zh-CN', { hour12: false })
  localStorage.setItem('fae_sync_last', t)
  syncState.value.lastSync = t
  syncState.value.syncing = false
}
export function isSyncConfigured() {
  return !!getToken()
}

export function useSync() {
  return {
    syncState,
    saveSyncToken, clearSyncToken, setSyncRepo,
    pullFromCloud, pushToCloud, mergeCloudIntoLocal,
    verifyToken, markSynced, isSyncConfigured
  }
}