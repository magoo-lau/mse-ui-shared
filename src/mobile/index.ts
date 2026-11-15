/** 移动子应用公共件（Vant 侧）。消费：import { initThemeBridge, vantToast } from 'mse-ui-shared/mobile' */
import { showToast } from 'vant'

export { initThemeBridge } from './theme/bridge'

/** vant 提示器：createRequest({ toast: vantToast }) */
export const vantToast = {
  error: (message: string) => {
    showToast(message)
  },
  warning: (message: string) => {
    showToast(message)
  }
}

