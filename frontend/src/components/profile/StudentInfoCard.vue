<script setup>
/**
 * StudentInfoCard.vue
 * Wide horizontal card showing name, school, grade, avatar, edit button.
 */
import { ref } from 'vue'
import { Pencil } from '@lucide/vue'

const props = defineProps({
  student:  { type: Object, required: true },
  initials: { type: String, default: '' },
})

const emit = defineEmits(['edit'])
</script>

<template>
  <div class="student-card">
    <!-- Avatar -->
    <div class="student-card__avatar" aria-hidden="true">
      <img
        v-if="student.avatar"
        :src="student.avatar"
        :alt="`${student.name} profile photo`"
        class="student-card__avatar-img"
      />
      <span v-else class="student-card__initials">{{ initials }}</span>
    </div>

    <!-- Info -->
    <div class="student-card__info">
      <p class="student-card__name">{{ student.name.toUpperCase() }}</p>
      <p class="student-card__school">{{ student.school }}</p>
      <p class="student-card__grade">{{ student.grade }}</p>
    </div>

    <!-- Edit button -->
    <button
      class="student-card__edit"
      type="button"
      aria-label="Edit profile"
      @click="$emit('edit')"
    >
      <Pencil :size="15" aria-hidden="true" />
    </button>
  </div>
</template>

<style scoped>
.student-card {
  display: flex;
  align-items: center;
  gap: 16px;
  background: #fff;
  border: 1px solid #e4e4ef;
  border-radius: 16px;
  padding: 14px 18px;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.05);
  position: relative;
  flex-shrink: 0;
}

/* ── Avatar ── */
.student-card__avatar {
  flex-shrink: 0;
  width: 76px;
  height: 76px;
  border-radius: 10px;
  background: #e0e0e8;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.student-card__avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.student-card__initials {
  font-size: 22px;
  font-weight: 700;
  color: #9090b0;
  letter-spacing: -0.02em;
  user-select: none;
}

/* ── Info ── */
.student-card__info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.student-card__name {
  font-size: 17px;
  font-weight: 700;
  color: #1a1a2e;
  letter-spacing: 0.01em;
  line-height: 1.15;
}

.student-card__school,
.student-card__grade {
  font-size: 12px;
  color: #5a5a7a;
  line-height: 1.4;
}

/* ── Edit button ── */
.student-card__edit {
  position: absolute;
  top: 16px;
  right: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: none;
  background: transparent;
  color: #b0b0c8;
  cursor: pointer;
  transition: background 150ms ease, color 150ms ease;
  flex-shrink: 0;
}

.student-card__edit:hover,
.student-card__edit:focus-visible {
  background: #f0f0f8;
  color: #4a4a6a;
  outline: 2px solid #d0d0ee;
  outline-offset: 1px;
}
</style>
