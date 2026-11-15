<template>
  <div class="pagination-wrap">
    <el-pagination background layout="total, sizes, prev, pager, next, jumper"
                   :total="total" :page-sizes="[10, 20, 50, 100]"
                   :current-page="page" :page-size="size"
                   @current-change="onPageChange" @size-change="onSizeChange" />
  </div>
</template>

<script setup lang="ts">
/** 列表分页（RuoYi 风格右对齐）：v-model:page / v-model:size 双向绑定 */
defineProps<{ total: number; page: number; size: number }>()
const emit = defineEmits<{ 'update:page': [number]; 'update:size': [number]; change: [] }>()

function onPageChange(page: number) {
  emit('update:page', page)
  emit('change')
}

function onSizeChange(size: number) {
  emit('update:size', size)
  emit('update:page', 1)
  emit('change')
}
</script>

<style scoped>
.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
