import { ElMessage } from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'

/** ElementPlus 全局注册参数（紧凑型 UI 风格约定见 AGENTS.md：size small + 中文）。
 *  用法：app.use(ElementPlus, elementPlusUseOptions) */
export const elementPlusUseOptions = { locale: zhCn, size: 'small' as const }

/** element-plus 提示器：createRequest({ toast: elementPlusToast }) */
export const elementPlusToast = {
  error: (message: string) => {
    ElMessage.error(message)
  },
  warning: (message: string) => {
    ElMessage.warning(message)
  }
}

/**
 * 修正 wujie 嵌入模式下的弹层漂移：Element Plus 把全部浮层（下拉/日期/tooltip 等）
 * 传送到 id 以 el-popper-container- 开头的容器里，该容器默认挂在 shadow body，
 * 会随子应用容器偏移（侧边栏 + 导航高度）；而 popper 按视口坐标计算、按主文档原点渲染，
 * 浮层因此整体漂移一个容器偏移量。把容器钉到视口原点即可对齐——fixed 0×0 不占版面不挡点击，
 * zIndex 抬过遮罩（Chrome 下 fixed 强制创建 stacking context，不抬会被 dialog 遮罩盖住）。
 * 独立运行时容器本就贴视口原点，本函数无副作用。
 */
export function fixPopperContainer() {
  const pin = (el: HTMLElement) => {
    Object.assign(el.style, { position: 'fixed', top: '0', left: '0', width: '0', height: '0', zIndex: '9999' })
  }
  const scan = () => document.body.querySelectorAll<HTMLElement>('div[id^="el-popper-container-"]').forEach(pin)
  scan()
  // 容器由首个浮层组件挂载时惰性创建，观察后续新增（保活重挂/热更后 id 会变）
  new MutationObserver(scan).observe(document.body, { childList: true })
}
