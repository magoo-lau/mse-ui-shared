<template>
  <div class="cron-input">
    <el-input
      :model-value="modelValue"
      :placeholder="placeholder"
      clearable
      @update:model-value="onInput"
    >
      <template #append>
        <el-button :icon="EditPen" @click="openDialog" />
      </template>
    </el-input>

    <!-- cron 图形化生成器（交互范式同 xxl-job：弹窗页签选择，底部实时预览，确定才回写输入框） -->
    <el-dialog v-model="dialogVisible" title="Cron 表达式" width="640px" :close-on-click-modal="false">
      <div v-if="!parseOk" class="parse-hint">当前表达式无法完全识别，已展示默认选项；调整任一选项即按所选重新生成</div>
      <el-tabs v-model="tab" class="opt-tabs">
        <el-tab-pane label="秒" name="second">
          <div class="opt-row"><el-radio v-model="sec.type" value="star">每秒</el-radio></div>
          <div class="opt-row">
            <el-radio v-model="sec.type" value="range">周期</el-radio>
            <template v-if="sec.type === 'range'">
              从 <el-input-number v-model="sec.from" :min="0" :max="59" :controls="false" class="num" /> 秒到
              <el-input-number v-model="sec.to" :min="0" :max="59" :controls="false" class="num" /> 秒
            </template>
          </div>
          <div class="opt-row">
            <el-radio v-model="sec.type" value="step">步进</el-radio>
            <template v-if="sec.type === 'step'">
              从 <el-input-number v-model="sec.start" :min="0" :max="59" :controls="false" class="num" /> 秒开始，每
              <el-input-number v-model="sec.step" :min="1" :max="59" :controls="false" class="num" /> 秒执行一次
            </template>
          </div>
          <div class="opt-row"><el-radio v-model="sec.type" value="pick">指定</el-radio></div>
          <el-checkbox-group v-if="sec.type === 'pick'" v-model="sec.picks" class="grid grid-10">
            <el-checkbox v-for="n in 60" :key="n - 1" :value="n - 1">{{ n - 1 }}</el-checkbox>
          </el-checkbox-group>
        </el-tab-pane>
        <el-tab-pane label="分钟" name="minute">
          <div class="opt-row"><el-radio v-model="min.type" value="star">每分钟</el-radio></div>
          <div class="opt-row">
            <el-radio v-model="min.type" value="range">周期</el-radio>
            <template v-if="min.type === 'range'">
              从 <el-input-number v-model="min.from" :min="0" :max="59" :controls="false" class="num" /> 分到
              <el-input-number v-model="min.to" :min="0" :max="59" :controls="false" class="num" /> 分
            </template>
          </div>
          <div class="opt-row">
            <el-radio v-model="min.type" value="step">步进</el-radio>
            <template v-if="min.type === 'step'">
              从 <el-input-number v-model="min.start" :min="0" :max="59" :controls="false" class="num" /> 分开始，每
              <el-input-number v-model="min.step" :min="1" :max="59" :controls="false" class="num" /> 分执行一次
            </template>
          </div>
          <div class="opt-row"><el-radio v-model="min.type" value="pick">指定</el-radio></div>
          <el-checkbox-group v-if="min.type === 'pick'" v-model="min.picks" class="grid grid-10">
            <el-checkbox v-for="n in 60" :key="n - 1" :value="n - 1">{{ n - 1 }}</el-checkbox>
          </el-checkbox-group>
        </el-tab-pane>
        <el-tab-pane label="小时" name="hour">
          <div class="opt-row"><el-radio v-model="hour.type" value="star">每小时</el-radio></div>
          <div class="opt-row">
            <el-radio v-model="hour.type" value="range">周期</el-radio>
            <template v-if="hour.type === 'range'">
              从 <el-input-number v-model="hour.from" :min="0" :max="23" :controls="false" class="num" /> 点到
              <el-input-number v-model="hour.to" :min="0" :max="23" :controls="false" class="num" /> 点
            </template>
          </div>
          <div class="opt-row">
            <el-radio v-model="hour.type" value="step">步进</el-radio>
            <template v-if="hour.type === 'step'">
              从 <el-input-number v-model="hour.start" :min="0" :max="23" :controls="false" class="num" /> 点开始，每
              <el-input-number v-model="hour.step" :min="1" :max="23" :controls="false" class="num" /> 小时执行一次
            </template>
          </div>
          <div class="opt-row"><el-radio v-model="hour.type" value="pick">指定</el-radio></div>
          <el-checkbox-group v-if="hour.type === 'pick'" v-model="hour.picks" class="grid grid-12">
            <el-checkbox v-for="n in 24" :key="n - 1" :value="n - 1">{{ n - 1 }}</el-checkbox>
          </el-checkbox-group>
        </el-tab-pane>
        <el-tab-pane label="日" name="day">
          <el-radio-group v-model="day.type" @change="onDayChange">
            <div class="opt-row"><el-radio value="star">每天</el-radio></div>
            <div class="opt-row"><el-radio value="qmark">不指定（由「周」页签决定）</el-radio></div>
            <div class="opt-row">
              <el-radio value="range">周期</el-radio>
              <template v-if="day.type === 'range'">
                从 <el-input-number v-model="day.from" :min="1" :max="31" :controls="false" class="num" /> 日到
                <el-input-number v-model="day.to" :min="1" :max="31" :controls="false" class="num" /> 日
              </template>
            </div>
            <div class="opt-row">
              <el-radio value="step">步进</el-radio>
              <template v-if="day.type === 'step'">
                从 <el-input-number v-model="day.start" :min="1" :max="31" :controls="false" class="num" /> 日开始，每
                <el-input-number v-model="day.step" :min="1" :max="31" :controls="false" class="num" /> 天执行一次
              </template>
            </div>
            <div class="opt-row"><el-radio value="last">本月最后一天</el-radio></div>
            <div class="opt-row"><el-radio value="lastWorkday">本月最后一个工作日</el-radio></div>
            <div class="opt-row">
              <el-radio value="nearWorkday">离指定日最近的工作日</el-radio>
              <template v-if="day.type === 'nearWorkday'">
                离 <el-input-number v-model="day.near" :min="1" :max="31" :controls="false" class="num" /> 日最近的工作日
              </template>
            </div>
            <div class="opt-row"><el-radio value="pick">指定</el-radio></div>
          </el-radio-group>
          <el-checkbox-group v-if="day.type === 'pick'" v-model="day.picks" class="grid grid-10">
            <el-checkbox v-for="n in 31" :key="n" :value="n">{{ n }}</el-checkbox>
          </el-checkbox-group>
        </el-tab-pane>
        <el-tab-pane label="月" name="month">
          <el-radio-group v-model="month.type">
            <div class="opt-row"><el-radio value="star">每月</el-radio></div>
            <div class="opt-row">
              <el-radio value="range">周期</el-radio>
              <template v-if="month.type === 'range'">
                从 <el-input-number v-model="month.from" :min="1" :max="12" :controls="false" class="num" /> 月到
                <el-input-number v-model="month.to" :min="1" :max="12" :controls="false" class="num" /> 月
              </template>
            </div>
            <div class="opt-row"><el-radio value="pick">指定</el-radio></div>
          </el-radio-group>
          <el-checkbox-group v-if="month.type === 'pick'" v-model="month.picks" class="grid grid-6">
            <el-checkbox v-for="n in 12" :key="n" :value="n">{{ n }}月</el-checkbox>
          </el-checkbox-group>
        </el-tab-pane>
        <el-tab-pane label="周" name="week">
          <el-radio-group v-model="week.type" @change="onWeekChange">
            <div class="opt-row"><el-radio value="qmark">不指定（由「日」页签决定）</el-radio></div>
            <div class="opt-row"><el-radio value="star">每周每天</el-radio></div>
            <div class="opt-row">
              <el-radio value="range">周期</el-radio>
              <template v-if="week.type === 'range'">
                从星期
                <el-select v-model="week.from" class="week-select">
                  <el-option v-for="o in weekOptions" :key="o.value" :value="o.value" :label="o.label" />
                </el-select>
                到星期
                <el-select v-model="week.to" class="week-select">
                  <el-option v-for="o in weekOptions" :key="o.value" :value="o.value" :label="o.label" />
                </el-select>
              </template>
            </div>
            <div class="opt-row">
              <el-radio value="step">间隔</el-radio>
              <template v-if="week.type === 'step'">
                从星期
                <el-select v-model="week.start" class="week-select">
                  <el-option v-for="o in weekOptions" :key="o.value" :value="o.value" :label="o.label" />
                </el-select>
                开始，每 <el-input-number v-model="week.step" :min="1" :max="6" :controls="false" class="num" /> 天执行一次
              </template>
            </div>
            <div class="opt-row"><el-radio value="pick">指定</el-radio></div>
            <div class="opt-row">
              <el-radio value="last">本月最后一个星期</el-radio>
              <el-select v-if="week.type === 'last'" v-model="week.last" class="week-select">
                <el-option v-for="o in weekOptions" :key="o.value" :value="o.value" :label="o.label" />
              </el-select>
            </div>
            <div class="opt-row">
              <el-radio value="nth">本月第 N 个星期 X</el-radio>
              <template v-if="week.type === 'nth'">
                本月第 <el-input-number v-model="week.nthN" :min="1" :max="5" :controls="false" class="num" /> 个星期
                <el-select v-model="week.nthIdx" class="week-select">
                  <el-option v-for="o in weekOptions" :key="o.value" :value="o.value" :label="o.label" />
                </el-select>
              </template>
            </div>
          </el-radio-group>
          <el-checkbox-group v-if="week.type === 'pick'" v-model="week.picks" class="week-grid">
            <el-checkbox v-for="o in weekOptions" :key="o.value" :value="o.value">星期{{ o.label }}</el-checkbox>
          </el-checkbox-group>
        </el-tab-pane>
        <el-tab-pane label="年" name="year">
          <el-radio-group v-model="year.type">
            <div class="opt-row"><el-radio value="none">不指定</el-radio></div>
            <div class="opt-row"><el-radio value="star">每年</el-radio></div>
            <div class="opt-row">
              <el-radio value="range">周期</el-radio>
              <template v-if="year.type === 'range'">
                从 <el-input-number v-model="year.from" :min="1970" :max="2099" :controls="false" class="num num-year" /> 年到
                <el-input-number v-model="year.to" :min="1970" :max="2099" :controls="false" class="num num-year" /> 年
              </template>
            </div>
            <div class="opt-row"><el-radio value="pick">指定</el-radio></div>
          </el-radio-group>
          <el-checkbox-group v-if="year.type === 'pick'" v-model="year.picks" class="grid grid-5">
            <el-checkbox v-for="y in yearOptions" :key="y" :value="y">{{ y }}</el-checkbox>
          </el-checkbox-group>
        </el-tab-pane>
      </el-tabs>
      <div class="gen-line">
        <span class="gen-label">表达式</span>
        <code class="gen-expr">{{ expr || '—' }}</code>
      </div>
      <div class="preview-box">
        <div class="preview-title">预览（最近 10 次执行时间）</div>
        <div v-if="dialogPreview && dialogPreview.valid" class="preview-times">
          <span v-for="t in dialogPreview.nextTimes || []" :key="t">{{ t }}</span>
        </div>
        <div v-else-if="dialogPreview" class="preview-error">{{ dialogPreview.message }}</div>
        <div v-else class="preview-hint">输入表达式后展示</div>
      </div>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmDialog">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
/* cron 图形化生成器（自 data-ui 精炼：交互范式同 xxl-job——弹窗页签选择、底部实时预览、
   确定才回写；previewUrl 提供且已 setHttp 接线时经后端校验并预览最近 10 次执行时间） */
import { nextTick, reactive, ref, watch } from 'vue'
import { EditPen } from '@element-plus/icons-vue'
import { getHttp } from '../../index'

const props = withDefaults(defineProps<{ modelValue: string; placeholder?: string; previewUrl?: string }>(), {
  placeholder: 'Spring cron：秒 分 时 日 月 周，如 0 */10 * * * ?',
  previewUrl: ''
})
const emit = defineEmits<{ (e: 'update:modelValue', v: string): void }>()

const tab = ref('second')
const dialogVisible = ref(false)
const parseOk = ref(false)
const dirty = ref(false)
const expr = ref('')

interface NumField {
  type: 'star' | 'range' | 'step' | 'pick'
  from: number
  to: number
  start: number
  step: number
  picks: number[]
}
interface DayField {
  type: 'star' | 'qmark' | 'range' | 'step' | 'last' | 'lastWorkday' | 'nearWorkday' | 'pick'
  from: number
  to: number
  start: number
  step: number
  near: number
  picks: number[]
}
interface MonthField {
  type: 'star' | 'range' | 'pick'
  from: number
  to: number
  picks: number[]
}
/** Spring CronExpression 周编号：0=周日（7 亦为周日）、1=周一 … 6=周六 */
interface WeekField {
  type: 'qmark' | 'star' | 'range' | 'step' | 'pick' | 'last' | 'nth'
  from: number
  to: number
  start: number
  step: number
  picks: number[]
  last: number
  nthIdx: number
  nthN: number
}
interface YearField {
  type: 'none' | 'star' | 'range' | 'pick'
  from: number
  to: number
  picks: number[]
}

// 默认值对应常用扫描节奏「0 0/10 * * * ?」
const sec = reactive<NumField>({ type: 'pick', from: 0, to: 5, start: 0, step: 10, picks: [0] })
const min = reactive<NumField>({ type: 'step', from: 0, to: 55, start: 0, step: 10, picks: [] })
const hour = reactive<NumField>({ type: 'star', from: 0, to: 23, start: 0, step: 1, picks: [] })
const day = reactive<DayField>({ type: 'star', from: 1, to: 31, start: 1, step: 1, near: 15, picks: [] })
const month = reactive<MonthField>({ type: 'star', from: 1, to: 12, picks: [] })
const week = reactive<WeekField>({ type: 'qmark', from: 1, to: 6, start: 1, step: 2, picks: [], last: 1, nthIdx: 1, nthN: 1 })
const year = reactive<YearField>({ type: 'none', from: new Date().getFullYear(), to: new Date().getFullYear() + 9, picks: [] })

const yearOptions = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i)
const weekOptions = [
  { value: 1, label: '一' },
  { value: 2, label: '二' },
  { value: 3, label: '三' },
  { value: 4, label: '四' },
  { value: 5, label: '五' },
  { value: 6, label: '六' },
  { value: 0, label: '日' }
]

function onInput(v: string) {
  emit('update:modelValue', v)
}

/** 日/周互斥（Spring 不允许二者同为 ?）：指定任一方，另一方让位为 ? */
function onDayChange() {
  if (day.type === 'qmark') {
    if (week.type === 'qmark') week.type = 'star'
  } else if (week.type !== 'qmark') {
    week.type = 'qmark'
  }
}
function onWeekChange() {
  if (week.type === 'qmark') {
    if (day.type === 'qmark') day.type = 'star'
  } else if (day.type !== 'qmark') {
    day.type = 'qmark'
  }
}

function numPart(f: NumField, max: number): string {
  if (f.type === 'star') return '*'
  if (f.type === 'range') return `${f.from}-${f.to}`
  if (f.type === 'step') return `${f.start}/${f.step}`
  return listPart(f.picks, 0, max)
}
function listPart(picks: number[], lo: number, hi: number): string {
  const vals = [...picks].filter((n) => n >= lo && n <= hi).sort((a, b) => a - b)
  return vals.length ? vals.join(',') : '*'
}
function genDay(): string {
  switch (day.type) {
    case 'star':
      return '*'
    case 'qmark':
      return '?'
    case 'range':
      return `${day.from}-${day.to}`
    case 'step':
      return `${day.start}/${day.step}`
    case 'last':
      return 'L'
    case 'lastWorkday':
      return 'LW'
    case 'nearWorkday':
      return `${day.near}W`
    case 'pick':
      return listPart(day.picks, 1, 31)
  }
}
function genWeek(): string {
  switch (week.type) {
    case 'qmark':
      return '?'
    case 'star':
      return '*'
    case 'range':
      return `${week.from}-${week.to}`
    case 'step':
      return `${week.start}/${week.step}`
    case 'last':
      return `${week.last}L`
    case 'nth':
      return `${week.nthIdx}#${week.nthN}`
    case 'pick':
      return listPart(week.picks, 0, 6)
  }
}
function genExpression(): string {
  const monthPart = month.type === 'star' ? '*' : month.type === 'range' ? `${month.from}-${month.to}` : listPart(month.picks, 1, 12)
  const parts = [numPart(sec, 59), numPart(min, 59), numPart(hour, 23), genDay(), monthPart, genWeek()]
  if (year.type === 'star') parts.push('*')
  else if (year.type === 'range') parts.push(`${year.from}-${year.to}`)
  else if (year.type === 'pick' && year.picks.length) parts.push(listPart(year.picks, 1970, 2099))
  return parts.join(' ')
}

// 图形化状态变化即重新生成候选表达式（解析回填期间抑制；确定时才回写输入框）
let parsing = false
watch([sec, min, hour, day, month, week, year], () => {
  if (parsing) return
  dirty.value = true
  expr.value = genExpression()
}, { deep: true })

function openDialog() {
  tab.value = 'second'
  dirty.value = false
  parsing = true
  parseOk.value = parseInto(props.modelValue || '')
  expr.value = (props.modelValue || '').trim()
  nextTick(() => {
    parsing = false
  })
  dialogVisible.value = true
}
function confirmDialog() {
  // 仅当用户在弹窗里动过选项才回写：无法识别的表达式确认时不会被默认值悄悄覆盖
  if (dirty.value) emit('update:modelValue', expr.value)
  dialogVisible.value = false
}

function parseNum(f: NumField, part: string, max: number): boolean {
  if (part === '*') {
    f.type = 'star'
    return true
  }
  let m = part.match(/^(\d+)-(\d+)$/)
  if (m) {
    const a = Number(m[1])
    const b = Number(m[2])
    if (a > b || b > max) return false
    f.type = 'range'
    f.from = a
    f.to = b
    return true
  }
  m = part.match(/^(\*|\d+)\/(\d+)$/)
  if (m) {
    const start = m[1] === '*' ? 0 : Number(m[1])
    const step = Number(m[2])
    if (step < 1 || start > max) return false
    f.type = 'step'
    f.start = start
    f.step = step
    return true
  }
  if (/^\d+$/.test(part)) {
    const v = Number(part)
    if (v > max) return false
    f.type = 'pick'
    f.picks = [v]
    return true
  }
  if (/^\d+(,\d+)+$/.test(part)) {
    const vals = part.split(',').map(Number)
    if (vals.some((v) => v > max)) return false
    f.type = 'pick'
    f.picks = vals
    return true
  }
  return false
}
function parseDay(f: DayField, part: string): boolean {
  if (part === '*') {
    f.type = 'star'
    return true
  }
  if (part === '?') {
    f.type = 'qmark'
    return true
  }
  if (part === 'LW') {
    f.type = 'lastWorkday'
    return true
  }
  if (part === 'L') {
    f.type = 'last'
    return true
  }
  let m = part.match(/^(\d{1,2})W$/)
  if (m) {
    const v = Number(m[1])
    if (v < 1 || v > 31) return false
    f.type = 'nearWorkday'
    f.near = v
    return true
  }
  m = part.match(/^(\d+)-(\d+)$/)
  if (m) {
    const a = Number(m[1])
    const b = Number(m[2])
    if (a < 1 || a > b || b > 31) return false
    f.type = 'range'
    f.from = a
    f.to = b
    return true
  }
  m = part.match(/^(\d+)\/(\d+)$/)
  if (m) {
    const start = Number(m[1])
    const step = Number(m[2])
    if (start < 1 || start > 31 || step < 1) return false
    f.type = 'step'
    f.start = start
    f.step = step
    return true
  }
  if (/^\d+(,\d+)*$/.test(part)) {
    const vals = part.split(',').map(Number)
    if (vals.some((v) => v < 1 || v > 31)) return false
    f.type = 'pick'
    f.picks = vals
    return true
  }
  return false
}
function parseMonth(f: MonthField, part: string): boolean {
  if (part === '*') {
    f.type = 'star'
    return true
  }
  const m = part.match(/^(\d{1,2})-(\d{1,2})$/)
  if (m) {
    const a = Number(m[1])
    const b = Number(m[2])
    if (a < 1 || a > b || b > 12) return false
    f.type = 'range'
    f.from = a
    f.to = b
    return true
  }
  if (/^\d+(,\d+)*$/.test(part)) {
    const vals = part.split(',').map(Number)
    if (vals.some((v) => v < 1 || v > 12)) return false
    f.type = 'pick'
    f.picks = vals
    return true
  }
  return false
}
function isWeekValue(v: number): boolean {
  return v >= 0 && v <= 7
}
function normWeek(v: number): number {
  return v === 7 ? 0 : v
}
function parseWeek(f: WeekField, part: string): boolean {
  if (part === '?') {
    f.type = 'qmark'
    return true
  }
  if (part === '*') {
    f.type = 'star'
    return true
  }
  let m = part.match(/^(\d{1,2})L$/)
  if (m) {
    const v = Number(m[1])
    if (!isWeekValue(v)) return false
    f.type = 'last'
    f.last = normWeek(v)
    return true
  }
  m = part.match(/^(\d{1,2})#(\d)$/)
  if (m) {
    const v = Number(m[1])
    if (!isWeekValue(v) || Number(m[2]) < 1) return false
    f.type = 'nth'
    f.nthIdx = normWeek(v)
    f.nthN = Number(m[2])
    return true
  }
  m = part.match(/^(\d{1,2})-(\d{1,2})$/)
  if (m) {
    const a = Number(m[1])
    const b = Number(m[2])
    // 含 7（周日）的区间无法无损归一为 0-6 生成格式，交回默认选项
    if (!isWeekValue(a) || !isWeekValue(b) || a === 7 || b === 7 || a > b) return false
    f.type = 'range'
    f.from = a
    f.to = b
    return true
  }
  m = part.match(/^(\d{1,2})\/(\d{1,2})$/)
  if (m) {
    const a = Number(m[1])
    const step = Number(m[2])
    if (!isWeekValue(a) || step < 1) return false
    f.type = 'step'
    f.start = normWeek(a)
    f.step = step
    return true
  }
  if (/^\d+(,\d+)*$/.test(part)) {
    const vals = part.split(',').map(Number)
    if (!vals.every(isWeekValue)) return false
    f.type = 'pick'
    f.picks = vals.map(normWeek)
    return true
  }
  return false
}
function parseYear(f: YearField, part: string): boolean {
  if (part === '*') {
    f.type = 'star'
    return true
  }
  const m = part.match(/^(\d{4})-(\d{4})$/)
  if (m) {
    const a = Number(m[1])
    const b = Number(m[2])
    if (a > b || a < 1970 || b > 2099) return false
    f.type = 'range'
    f.from = a
    f.to = b
    return true
  }
  if (/^\d{4}(,\d{4})*$/.test(part)) {
    const vals = part.split(',').map(Number)
    if (vals.some((v) => v < 1970 || v > 2099)) return false
    f.type = 'pick'
    f.picks = vals
    return true
  }
  return false
}

/** 打开弹窗时把当前表达式尽量解析回选项；任一字段无法识别则整体保持默认并提示 */
function parseInto(exprText: string): boolean {
  const parts = exprText.trim().split(/\s+/)
  if (parts.length < 6 || parts.length > 7) return false
  const s = { ...sec, picks: [] }
  const m = { ...min, picks: [] }
  const h = { ...hour, picks: [] }
  const d = { ...day, picks: [] }
  const mo = { ...month, picks: [] }
  const w = { ...week, picks: [] }
  const y = { ...year, picks: [] }
  if (!parseNum(s, parts[0], 59) || !parseNum(m, parts[1], 59) || !parseNum(h, parts[2], 23)) return false
  if (!parseDay(d, parts[3]) || !parseMonth(mo, parts[4]) || !parseWeek(w, parts[5])) return false
  if (parts.length === 7 && !parseYear(y, parts[6])) return false
  Object.assign(sec, s)
  Object.assign(min, m)
  Object.assign(hour, h)
  Object.assign(day, d)
  Object.assign(month, mo)
  Object.assign(week, w)
  Object.assign(year, y)
  if (parts.length < 7) year.type = 'none'
  return true
}

interface PreviewData {
  valid: boolean
  message?: string | null
  nextTimes?: string[]
}
const dialogPreview = ref<PreviewData | null>(null)
const seq = { dialog: 0 }

async function runPreview(cron: string) {
  cron = (cron || '').trim()
  if (!cron) {
    dialogPreview.value = null
    return
  }
  const s = ++seq.dialog
  try {
    const http = getHttp()
    if (!props.previewUrl || !http) {
      dialogPreview.value = null
      return
    }
    const data: any = await http.get(props.previewUrl, { params: { cron } })
    if (s !== seq.dialog) return
    dialogPreview.value = data
  } catch {
    // 失败保留上次结果；错误提示由拦截器统一弹出
  }
}

// 弹窗内选项调整：实时刷新弹窗预览
let dialogTimer: ReturnType<typeof setTimeout> | undefined
watch(expr, (v) => {
  clearTimeout(dialogTimer)
  dialogTimer = setTimeout(() => runPreview(v), 300)
})
</script>

<style scoped>
.preview-title {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.preview-times {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  column-gap: 12px;
  font-size: 12px;
  color: var(--el-text-color-regular);
  font-variant-numeric: tabular-nums;
}
.preview-error {
  font-size: 12px;
  color: var(--el-color-danger);
}
.preview-hint {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.parse-hint {
  font-size: 12px;
  color: var(--el-color-warning);
  margin-bottom: 8px;
}
.opt-tabs :deep(.el-tab-pane) {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 4px;
}
/* el-radio-group 默认 inline-flex + font-size: 0 + align-items: center：会把逐行选项挤成一行，
   行内裸文案（从星期/到星期等）不可见，且纵向排列时行被水平居中，这里一并改掉 */
.opt-tabs :deep(.el-radio-group) {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  row-gap: 8px;
  font-size: var(--el-font-size-base);
}
.opt-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  min-height: 28px;
}
.opt-row :deep(.el-radio) {
  margin-right: 0;
}
.num {
  width: 54px;
}
.num-year {
  width: 74px;
}
.week-select {
  width: 76px;
}
.gen-line {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  font-size: 12px;
}
.gen-label {
  color: var(--el-text-color-secondary);
}
.gen-expr {
  font-family: var(--el-font-family, inherit);
  font-size: 13px;
  color: var(--el-text-color-primary);
  letter-spacing: 1px;
}
.preview-box {
  margin-top: 12px;
  padding: 10px 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 4px;
  background-color: var(--el-fill-color-light);
}
.preview-box .preview-times {
  margin-top: 6px;
}
.week-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 10px;
}
.grid-10 {
  display: grid;
  grid-template-columns: repeat(10, 1fr);
}
.grid-12 {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
}
.grid-6 {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
}
.grid-5 {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
}
.grid :deep(.el-checkbox),
.week-grid :deep(.el-checkbox) {
  margin-right: 0;
}
</style>
