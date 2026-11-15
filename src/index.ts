/**
 * mse-ui-shared 核心入口（PC/移动通用，不依赖任何 UI 库）。
 *
 * 契约权威方：mse-framework/mse-ui/src/micro/（WujieContainer.vue props 下发 + index.ts bus 事件），
 * mse-ui-mobile/src/micro/ 为同一契约的对齐实现。本包只固化契约类型与最小运行时，勿在此扩展业务逻辑。
 */

/** 是否运行在主应用（wujie）中 */
export function embedded(): boolean {
  return !!window.__POWERED_BY_WUJIE__
}

/** 主应用通过 wujie props 下发的数据（见 mse-ui src/micro/WujieContainer.vue） */
export interface MainAppProps {
  /** 子应用在主应用中的路由前缀，router base 依赖它 */
  urlPrefix?: string
  token?: string
  tenantId?: string | number
  platform?: boolean
  nickname?: string
  /** 权限码集合（超管为 ['*']），按钮级显隐依赖它 */
  permissions?: string[]
}

/** wujie 总线事件名（定义方：mse-ui / mse-ui-mobile 的 src/micro/index.ts） */
export const BUS_EVENTS = {
  /** 主应用 → 子应用：登录态五字段变更 */
  authChange: 'auth:change',
  /** 主应用 → 子应用：主题快照 { dark, primary } 变更 */
  themeChange: 'theme:change',
  /** 子应用 → 主应用：401 统一登出 */
  authExpired: 'sub:auth-expired',
  /** 子应用 → 主应用：上报 { urlPrefix }，主应用记录路由关联 */
  ready: 'sub:ready',
  /** 子应用 → 主应用：上报 { urlPrefix, path, fullPath?, title }，驱动页签/面包屑 */
  title: 'sub:title',
  /** 主应用 → 子应用：主应用侧路由驱动子应用跳转 */
  navigate: 'sub:navigate',
  /** 主应用内部：页签刷新重建子应用（子应用无感） */
  refresh: 'sub:refresh'
} as const

/** 共享组件可用的最小 HTTP 形状（各工程把自建 axios 实例 setHttp 注入，复用其拦截器/鉴权语义） */
export interface HttpLike {
  get(url: string, config?: Record<string, unknown>): Promise<any>
}

let http: HttpLike | null = null

/** 注入本工程的 axios 实例，供共享组件（如 CronInput 预览）发起请求 */
export function setHttp(instance: HttpLike): void {
  http = instance
}

/** 取已注入的 axios 实例；未注入（子应用未接线）返回 null，共享组件据此静默降级 */
export function getHttp(): HttpLike | null {
  return http
}

export { createPermissionDirective } from './directives/permission'
export { createRequest } from './api/createRequest'
export type { CreateRequestOptions, RequestToast } from './api/createRequest'
export { downloadFile } from './api/download'
export { createAuthStore } from './auth/store'
export type { MainAppAuth } from './auth/store'
export { sanitizeSearchHighlight } from './utils/sanitize'

declare global {
  interface Window {
    __POWERED_BY_WUJIE__?: boolean
    __WUJIE_MOUNT?: () => void
    __WUJIE_UNMOUNT?: () => void
    $wujie?: {
      props: MainAppProps
      bus: {
        $on: (event: string, callback: (...args: any[]) => void) => void
        $off: (event: string, callback: (...args: any[]) => void) => void
        $emit: (event: string, ...args: any[]) => void
      }
    }
  }
}
