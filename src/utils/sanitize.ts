/**
 * 检索高亮片段消毒（纯 DOM，无 UI 库依赖，PC/移动通用）。
 *
 * 后端 ES highlight 已配 encoder:"html"（字段原文转义、仅 <em> 标签字面保留），
 * 前端 v-html 渲染前仍经本函数白名单二次设防：全文转义后仅回放 <em>/<em/>，
 * 检索内容中任何毒化标签（<img onerror>、<script> 等）均以转义文本呈现不执行。
 */
export function sanitizeSearchHighlight(html: string | null | undefined): string {
  if (!html) {
    return ''
  }
  const div = document.createElement('div')
  div.textContent = html
  return div.innerHTML.replace(/&lt;(\/?)em&gt;/g, '<$1em>')
}
