/**
 * 主题桥接：跟随基座外观（深浅色模式 + 主题色），与 auth:change 同模式的 bus 订阅。
 *
 * - 嵌入运行：初始值读 wujie props.theme（基座解析后的快照，auto 已解析），后续经 bus
 *   的 theme:change 事件跟随；alive 保活下监听常驻
 * - 独立运行：读本地 mse-theme 偏好（与基座同 key，同源部署时直接继承用户偏好），
 *   auto 模式经 matchMedia 解析并监听系统切换；无偏好默认亮色
 * - wujie 渲染 DOM 挂在 shadow root 内的 <html> 上，且子应用 documentElement 被代理到
 *   该节点（wujie modifyProperties）——与独立运行同一套 documentElement 操作即可
 */

interface ThemeSnapshot {
  dark: boolean
  primary: string
}

const DEFAULT_PRIMARY = '#409eff'
/** Element Plus 暗色衍生变量的混合基准（与基座 stores/theme.ts 保持一致） */
const DARK_MIX_BASE = '#141414'

function parseHex(color: string): [number, number, number] | null {
  let hex = color.trim().replace(/^#/, '')
  if (hex.length === 3) hex = hex.split('').map((c) => c + c).join('')
  if (!/^[0-9a-fA-F]{6}$/.test(hex)) return null
  return [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16)]
}

function mix(color: string, another: string, weight: number): string {
  const a = parseHex(color)
  const b = parseHex(another)
  if (!a || !b) return color
  const rgb = a.map((c, i) => Math.round(c + (b[i] - c) * weight))
  return `#${rgb.map((c) => c.toString(16).padStart(2, '0')).join('')}`
}

/** 主色衍生变量组（与基座同算法：light-N 向白/#141414 混、dark-2 亮色向白/暗色向黑混） */
function primaryVars(primary: string, dark: boolean): Record<string, string> {
  const base = dark ? DARK_MIX_BASE : '#ffffff'
  const vars: Record<string, string> = { '--el-color-primary': primary }
  for (const n of [3, 5, 7, 8, 9]) {
    vars[`--el-color-primary-light-${n}`] = mix(primary, base, n / 10)
  }
  vars['--el-color-primary-dark-2'] = mix(primary, dark ? '#000000' : '#ffffff', 0.2)
  return vars
}

function applyTheme(dark: boolean, primary: string) {
  document.documentElement.classList.toggle('dark', dark)
  for (const [key, value] of Object.entries(primaryVars(primary, dark))) {
    document.documentElement.style.setProperty(key, value)
  }
}

/** 应用启动调用一次（App.vue onMounted）：按运行形态取初始主题并常驻监听 */
export function initThemeBridge() {
  const wujie = (window as unknown as {
    $wujie?: { props?: { theme?: ThemeSnapshot }; bus?: { $on: (e: string, cb: (t: ThemeSnapshot) => void) => void } }
  }).$wujie
  if (wujie) {
    const snapshot = wujie.props?.theme
    if (snapshot?.primary) applyTheme(!!snapshot.dark, snapshot.primary)
    wujie.bus?.$on('theme:change', (t) => {
      if (t?.primary) applyTheme(!!t.dark, t.primary)
    })
    return
  }
  // 独立运行：本地偏好兜底（与基座同 localStorage key），auto 跟随系统
  let mode = 'light'
  let primary = DEFAULT_PRIMARY
  try {
    const saved = JSON.parse(localStorage.getItem('mse-theme') || 'null') as { mode?: string; primary?: string } | null
    if (saved?.mode === 'light' || saved?.mode === 'dark' || saved?.mode === 'auto') mode = saved.mode
    if (saved?.primary && parseHex(saved.primary)) primary = saved.primary
  } catch {
    /* 坏数据按默认值处理 */
  }
  const mql = window.matchMedia('(prefers-color-scheme: dark)')
  const darkOf = () => mode === 'dark' || (mode === 'auto' && mql.matches)
  applyTheme(darkOf(), primary)
  if (mode === 'auto') {
    mql.addEventListener('change', () => applyTheme(darkOf(), primary))
  }
}
