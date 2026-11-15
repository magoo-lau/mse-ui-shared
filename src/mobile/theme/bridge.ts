/**
 * 主题桥接（Vant 版）：跟随移动基站外观（深浅色模式 + 主题色），与 auth:change 同模式的 bus 订阅。
 * 嵌入运行读 wujie props.theme 快照 + 订阅 theme:change；独立运行回退本地 mse-theme 偏好。
 *
 * 【wujie 暗色适配（关键）】wujie 会把子应用 CSS 的 `:root` 改写为 `:root,:host`——变量实际定义在
 * 主文档的 host 元素上，并以「计算后的值」继承进 shadow tree。暗色类（.van-theme-dark）加在 shadow
 * 内部 html 上只能覆盖 dark 块里重定义的基础 token（--van-background-2 等）；而衍生变量如
 * `--van-nav-bar-background: var(--van-background-2)` 只在 :host 有定义，已在 host 上固化为浅色值
 * 再继承进来，内部类无法联动——表现为「页面背景黑了、导航栏/卡片仍是白色」。
 * 故从已加载的 Vant 样式表提取 :root/:host 与 .van-theme-dark 两个变量集，按当前模式内联写入
 * documentElement：内联元素级定义覆盖 :host 继承，且其中的 var() 引用在内联上下文重新解析联动。
 * （PC 端 Element Plus 无此问题：其 dark 变量块重定义全量变量，html.dark 内部类即可全覆盖。）
 */
interface ThemeSnapshot {
  dark: boolean
  primary: string
}

const DEFAULT_PRIMARY = '#409eff'

function parseHex(color: string): boolean {
  const hex = color.trim().replace(/^#/, '')
  return /^[0-9a-fA-F]{6}$/.test(hex.length === 3 ? hex.split('').map((c) => c + c).join('') : hex)
}

/** 从已加载的 <style> 样式表收集 Vant 变量集：light=:root/:host 块全集，dark=.van-theme-dark 块覆盖集 */
function collectVantVarSets(): { light: Record<string, string>; dark: Record<string, string> } {
  const light: Record<string, string> = {}
  const dark: Record<string, string> = {}
  const walk = (rules: CSSRuleList | undefined) => {
    if (!rules) return
    for (const rule of Array.from(rules)) {
      const grouping = rule as CSSGroupingRule
      if (grouping.cssRules && grouping.cssRules.length) walk(grouping.cssRules)
      const styleRule = rule as CSSStyleRule
      const sel = styleRule.selectorText
      if (!sel || !styleRule.style) continue
      // wujie 改写后选择器为 ":root,:host{...}"（或原样 ":root"、":host"）；dark 覆盖块为 ".van-theme-dark"
      const isRoot = /(^|,)\s*(:root|:host)\s*(,|$)/.test(sel)
      const isDark = /(^|,)\s*\.van-theme-dark\s*(,|$)/.test(sel)
      if (!isRoot && !isDark) continue
      const decl = styleRule.style
      for (let i = 0; i < decl.length; i++) {
        const prop = decl.item(i)
        if (prop.startsWith('--van-')) {
          (isDark ? dark : light)[prop] = decl.getPropertyValue(prop).trim()
        }
      }
    }
  }
  // wujie 代理下 document.querySelectorAll 即 shadow root 内样式（独立运行为主文档样式，同函数适用）
  for (const style of Array.from(document.querySelectorAll('style'))) {
    walk(style.sheet?.cssRules)
  }
  return { light, dark }
}

let appliedVanVarKeys: string[] = []

/** 按当前模式把 Vant 变量集内联到根元素（覆盖 :host 固化值）；样式未就绪时延迟补偿一次 */
function applyVanVars(root: HTMLElement, dark: boolean) {
  const { light, dark: darkVars } = collectVantVarSets()
  if (!Object.keys(light).length) {
    // CSS 尚未注入（早于样式装载调用）：延迟重试一次；theme:change 后续切换亦会重写
    setTimeout(() => applyVanVars(root, dark), 500)
    return
  }
  const next = { ...light, ...(dark ? darkVars : {}) }
  // 主色由 applyTheme 单独管理：Vant :root 的默认主色（var(--van-blue, #1989fa)）不得覆盖基座下发的主色
  delete next['--van-primary-color']
  // 清掉上次写入而本次集合没有的 key（dark 独有 token），防模式切换残留
  for (const key of appliedVanVarKeys) {
    if (!(key in next)) root.style.removeProperty(key)
  }
  for (const [key, value] of Object.entries(next)) {
    root.style.setProperty(key, value)
  }
  appliedVanVarKeys = Object.keys(next)
}

function applyTheme(dark: boolean, primary: string) {
  const root = document.documentElement
  root.classList.toggle('dark', dark)
  root.classList.toggle('van-theme-dark', dark)
  applyVanVars(root, dark)
  // 主色最后写：与变量集内联解耦（applyVanVars 已排除该 key，此处仅受基座 snapshot 控制）
  if (parseHex(primary)) root.style.setProperty('--van-primary-color', primary)
}

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
