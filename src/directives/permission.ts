import type { Directive } from 'vue'

/**
 * 按钮级权限指令工厂：v-permission="'demo:order:create'"（数组 = 任一命中）。
 * 无权限时直接移除元素。权限判定函数由各工程注入（接自己的 auth store，
 * 因 store 实例属于各工程的 pinia，本包不持有）——工程侧用法：
 *
 *   // directives/permission.ts（本地薄包装）
 *   import { createPermissionDirective } from 'mse-ui-shared/pc'
 *   import { useAuthStore } from '../stores/auth'
 *   export const permission = createPermissionDirective((code) => useAuthStore().hasPermission(code))
 */
export function createPermissionDirective(
  hasPermission: (code: string | string[] | undefined) => boolean
): Directive<HTMLElement, string | string[]> {
  return {
    mounted(el, binding) {
      if (!hasPermission(binding.value)) {
        el.parentNode?.removeChild(el)
      }
    }
  }
}
