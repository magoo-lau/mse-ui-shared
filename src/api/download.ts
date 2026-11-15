import axios from 'axios'
import type { RequestToast } from './createRequest'

/**
 * 文件下载（Excel 导出/导入模板等 blob 响应）：文件名取 content-disposition（RFC 5987 filename*=UTF-8''）。
 * 后端异常时仍可能返回 JSON 错误体，据 content-type 识别并提示。
 */
export async function downloadFile(
  url: string,
  params?: Record<string, unknown>,
  opts?: { getToken?: () => string | undefined; toast?: Pick<RequestToast, 'error'> },
  defaultName = '下载文件'
) {
  const resp = await axios.get(`/api${url}`, {
    params,
    responseType: 'blob',
    headers: { Authorization: opts?.getToken?.() || '' }
  })
  const contentType = String(resp.headers['content-type'] || '')
  if (contentType.includes('application/json')) {
    const text = await (resp.data as Blob).text()
    try {
      opts?.toast?.error(JSON.parse(text).message || '下载失败')
    } catch {
      opts?.toast?.error('下载失败')
    }
    return
  }
  const disposition = String(resp.headers['content-disposition'] || '')
  let filename = defaultName
  const star = /filename\*=UTF-8''([^;]+)/i.exec(disposition)
  if (star) {
    filename = decodeURIComponent(star[1])
  } else {
    const plain = /filename="?([^";]+)"?/i.exec(disposition)
    if (plain) filename = plain[1]
  }
  const link = document.createElement('a')
  link.href = URL.createObjectURL(resp.data)
  link.download = filename
  link.click()
  URL.revokeObjectURL(link.href)
}
