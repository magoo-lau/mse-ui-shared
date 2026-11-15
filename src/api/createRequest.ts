import axios from 'axios'
import type { AxiosInstance } from 'axios'
import { embedded, setHttp } from '../index'

/** 单请求静默标记：非 0 业务码 / 非 401 异常不弹全局提示，由调用方自行降级 */
declare module 'axios' {
  export interface AxiosRequestConfig {
    skipErrorToast?: boolean
  }
}

/** 提示器：PC 侧用 pc 入口的 elementPlusToast，移动侧用 mobile 入口的 vantToast（本包不绑定 UI 库） */
export interface RequestToast {
  error: (message: string) => void
  warning: (message: string) => void
}

export interface CreateRequestOptions {
  /** 请求令牌取值：各工程接自己的 auth store（初始值来自主应用 props，auth:change 实时更新） */
  getToken: () => string | undefined
  /** 提示器（必传，避免本包绑定 UI 库） */
  toast: RequestToast
  /** 超时毫秒，缺省 15000 */
  timeout?: number
  /** 业务码非 0 时 reject 完整响应体（含 code，调用方可按码分支）；缺省 reject new Error(message) */
  rejectBody?: boolean
  /** blob 响应（文件下载）不解包直接透传整个 response，调用方自行处理 */
  blobPassthrough?: boolean
  /** 网络异常提示优先取后端 message（error.response.data.message）；缺省只提示 error.message */
  networkErrorFromResponse?: boolean
  /** 独立运行（非 wujie 嵌入）遇 401 的处理钩子；缺省提示「会话已过期，请回到主应用重新登录」 */
  on401Local?: () => void
}

/**
 * 子应用 axios 实例工厂（基线语义 = 原各工程手写版的最小公倍数）：
 * baseURL=/api、token 注入 Authorization（裸值非 Bearer）、code===0 解包 body.data、
 * 401 嵌入模式经 bus 上报 sub:auth-expired 交主应用统一登出、业务错误/网络异常 toast 提示
 * （单请求可 config.skipErrorToast 静默）。创建后自动接线 setHttp（共享组件如 CronInput 预览复用本实例）。
 * 基座（mse-ui / mse-ui-mobile）自有登录链路，不适用本工厂。
 */
export function createRequest(options: CreateRequestOptions): AxiosInstance {
  const {
    getToken,
    toast,
    timeout = 15000,
    rejectBody = false,
    blobPassthrough = false,
    networkErrorFromResponse = false,
    on401Local
  } = options

  const request = axios.create({ baseURL: '/api', timeout })

  request.interceptors.request.use((config) => {
    // 从 authStore 取 token：初始值来自主应用 props，后续由 auth:change 事件实时更新
    //（alive 保活下主应用重新登录不会刷新 props，直接读 props 会拿到旧值）
    const token = getToken()
    if (token) config.headers.Authorization = token
    return config
  })

  request.interceptors.response.use(
    (response) => {
      // blob 响应（文件下载）不解析业务包裹，交给调用方处理
      if (blobPassthrough && response.config.responseType === 'blob') return response
      const body = response.data
      if (body.code === 0) return body.data
      if (!response.config.skipErrorToast) toast.error(body.message || '请求失败')
      return rejectBody ? Promise.reject(body) : Promise.reject(new Error(body.message))
    },
    (error) => {
      if (error.response?.status === 401) {
        if (embedded()) {
          // 嵌入模式：交由主应用统一登出并跳转登录页
          window.$wujie?.bus.$emit('sub:auth-expired')
        } else {
          ;(on401Local ?? (() => toast.warning('会话已过期，请回到主应用重新登录')))()
        }
      } else if (!error.config?.skipErrorToast) {
        toast.error(
          networkErrorFromResponse
            ? error.response?.data?.message || error.message || '网络异常'
            : error.message || '网络异常'
        )
      }
      return rejectBody ? Promise.reject(error.response?.data || error) : Promise.reject(error)
    }
  )

  // 接线共享包：CronInput 预览等共享组件经此实例发请求（复用拦截器/鉴权语义）
  setHttp(request)
  return request
}
