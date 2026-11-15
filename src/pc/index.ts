/** PC 子应用公共件（element-plus 侧）。消费：import { CronInput, Pagination, initThemeBridge } from 'mse-ui-shared/pc'；
 *  createPermissionDirective 在核心入口（移动端工程勿经本入口引到 element-plus 组件） */
export { default as Pagination } from './components/Pagination.vue'
export { default as CronInput } from './components/CronInput.vue'
export { initThemeBridge } from './theme/bridge'
export { createPermissionDirective } from '../directives/permission'
export { elementPlusUseOptions, elementPlusToast, fixPopperContainer } from './app'
