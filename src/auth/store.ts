import { defineStore } from 'pinia'

export interface MainAppAuth {
  token: string
  tenantId: string | number
  platform: boolean
  nickname: string
  /** 权限码集合（超管为 ['*']） */
  permissions: string[]
}

/**
 * 主应用下发登录态的 auth store 工厂。各工程用法：
 *
 *   // src/stores/auth.ts
 *   import { createAuthStore } from 'mse-ui-shared'
 *   export const useAuthStore = createAuthStore()
 *
 * 嵌入模式下初始值来自 wujie props，后续主应用登录/登出经 bus 的 auth:change
 * 事件更新（App.vue 挂载时调一次 listenMainApp）。
 */
export function createAuthStore(id = 'auth') {
  return defineStore(id, {
    state: (): MainAppAuth & { embedded: boolean } => ({
      token: window.$wujie?.props?.token || '',
      tenantId: window.$wujie?.props?.tenantId ?? '',
      platform: !!window.$wujie?.props?.platform,
      nickname: window.$wujie?.props?.nickname || '',
      permissions: window.$wujie?.props?.permissions || [],
      embedded: !!window.__POWERED_BY_WUJIE__
    }),
    getters: {
      /** 按钮级权限判定：超管（*）全通过；空入参视为通过；数组入参任一命中即通过 */
      hasPermission(): (codes: string | string[]) => boolean {
        return (codes: string | string[]) => {
          const list = Array.isArray(codes) ? codes : [codes]
          if (!list.length) return true
          if (this.permissions.includes('*')) return true
          return list.some((code) => this.permissions.includes(code))
        }
      }
    },
    actions: {
      apply(auth: Partial<MainAppAuth>) {
        Object.assign(this, auth)
      },
      /** 订阅主应用登录态变化，在 App.vue 挂载时调用一次 */
      listenMainApp() {
        window.$wujie?.bus.$on('auth:change', (auth: Partial<MainAppAuth>) => this.apply(auth))
      }
    }
  })
}
