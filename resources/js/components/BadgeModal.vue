<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content badge-modal-card" role="dialog" aria-modal="true" aria-labelledby="badge-title">
      <div class="modal-header">
        <button type="button" class="modal-close-btn" @click="$emit('close')" aria-label="Close modal">&times;</button>
      </div>

      <div class="badge-modal-body">
        <div class="modal-badge-showcase">
          <div class="holo-shimmer-border large-border"></div>
          <div class="modal-badge-core">
            <img v-if="badge.badgeImage" :src="badge.badgeImage" :alt="badge.title" class="badge-img" />
            <svg v-else class="badge-svg-icon" viewBox="0 0 100 100" fill="none">
              <circle cx="50" cy="50" r="30" fill="#a855f7" opacity="0.6"/>
              <circle cx="50" cy="50" r="32" stroke="#d8b4fe" stroke-width="3" stroke-dasharray="4 6"/>
              <circle cx="50" cy="50" r="14" fill="#130924" stroke="#e879f9" stroke-width="2" />
              <circle cx="50" cy="38" r="4.5" fill="#f5d0fe" />
              <circle cx="62" cy="50" r="4.5" fill="#f5d0fe" />
              <circle cx="50" cy="62" r="4.5" fill="#f5d0fe" />
              <circle cx="38" cy="50" r="4.5" fill="#f5d0fe" />
              <circle cx="50" cy="50" r="5" fill="#ffffff" />
            </svg>
          </div>
        </div>

        <h3 class="badge-modal-title" id="badge-title">{{ badge.title }}</h3>
        <p class="badge-category">{{ badge.category || 'Robotics & Control Systems' }}</p>
        <p class="badge-desc">{{ badge.description }}</p>

        <div class="badge-criteria-box">
          <div v-for="(criterion, idx) in criteriaList" :key="idx" class="criteria-item">
            <span class="check-icon">✓</span>
            <span>{{ criterion }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  badge: {
    type: Object,
    required: true,
  },
});

defineEmits(['close']);

const criteriaList = computed(() => {
  if (props.badge.criteria && Array.isArray(props.badge.criteria) && props.badge.criteria.length) {
    return props.badge.criteria;
  }
  const title = (props.badge.title || '').toLowerCase();
  if (title.includes('speed') || title.includes('test')) {
    return [
      'Calibrated All 3 Star Chart Checkpoints (100%)',
      'Demonstrated Rapid Prototyping & Signal Flow',
      'Verified by Rizal Polytechnic Evaluators',
    ];
  }
  return [
    `Mastered ${props.badge.title} Calibration & Standards (100%)`,
    'Completed All Checkpoints in Sequence',
    'Verified by Rizal Polytechnic Evaluators',
  ];
});
</script>

<style scoped>
.badge-modal-card {
  text-align: center;
}

.modal-header {
  display: flex;
  justify-content: flex-end;
  width: 100%;
  margin-bottom: 2px;
}

.badge-modal-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px 0 20px 0;
}

.modal-badge-showcase {
  position: relative;
  width: 140px;
  height: 140px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
}

.large-border {
  border-radius: 36px;
  inset: -6px;
}

.modal-badge-core {
  position: relative;
  width: 128px;
  height: 128px;
  border-radius: 30px;
  background: radial-gradient(circle at center, #2e1065 0%, #0f0728 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
  box-shadow: inset 0 2px 8px rgba(255, 255, 255, 0.3), inset 0 -4px 8px rgba(0, 0, 0, 0.8);
  overflow: hidden;
}

.badge-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.badge-modal-title {
  font-size: 24px;
  font-weight: 800;
  color: #111827;
  margin-bottom: 4px;
}

.badge-category {
  font-size: 13px;
  font-weight: 600;
  color: #ff7a00;
  margin-bottom: 12px;
}

.badge-desc {
  font-size: 14px;
  color: #4b5563;
  line-height: 1.5;
  max-width: 400px;
  margin-bottom: 20px;
}

.badge-criteria-box {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 14px 18px;
  width: 100%;
  text-align: left;
}

.criteria-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  color: #334155;
  font-weight: 500;
  margin-bottom: 6px;
}

.criteria-item:last-child {
  margin-bottom: 0;
}

.check-icon {
  color: #10b981;
  font-weight: 800;
}
</style>
