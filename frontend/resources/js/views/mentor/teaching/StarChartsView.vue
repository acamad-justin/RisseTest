<!-- frontend/resources/js/views/mentor/teaching/StarChartsView.vue -->
<template>
  <div class="star-charts-page">
    <header class="page-header">
      <div>
        <h1 class="page-title">Star Chart & Milestone Governance</h1>
        <p class="page-subtitle">
          Award and verify milestone stars for practical laboratory demonstrations and tournament achievements.
        </p>
      </div>
    </header>

    <!-- Invariant Banner -->
    <div class="invariant-banner">
      <div class="shield-icon-circle">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#2563eb" stroke-width="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
      </div>
      <div class="invariant-text">
        <strong>Pedagogical Invariant:</strong>
        Manually awarded stars celebrate laboratory milestones and engineering sportsmanship. They are permanently logged with audit notes and <em>never</em> bypass or fabricate verified concept mastery records.
      </div>
    </div>

    <!-- Student Selector Toolbar -->
    <div class="selection-toolbar">
      <div class="selector-col">
        <label for="select-chart-student" class="selector-label">Select Student:</label>
        <select 
          id="select-chart-student"
          :value="selectedStudentId" 
          @change="handleStudentSelect($event.target.value)"
          class="student-dropdown"
        >
          <option value="" disabled>-- Select student from assigned classes --</option>
          <option 
            v-for="s in students" 
            :key="s.student_id" 
            :value="s.student_id"
          >
            {{ s.name }} ({{ s.section_code }})
          </option>
        </select>
      </div>

      <button 
        v-if="activeStudent"
        type="button" 
        class="btn-studio-primary" 
        @click="handleAwardStar"
      >
        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
        Award Star Achievement
      </button>
    </div>

    <!-- Empty State if No Students Enrolled -->
    <div v-if="students.length === 0" class="charts-empty-state">
      <div class="empty-icon-circle">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#64748b" stroke-width="2">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      </div>
      <h2 class="empty-title">No Students Enrolled</h2>
      <p class="empty-desc">
        There are no students enrolled in your assigned sections to manage Star Charts for.
      </p>
    </div>

    <!-- Empty State if No Student Selected -->
    <div v-else-if="!activeStudent" class="charts-empty-state">
      <div class="empty-icon-circle">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#64748b" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="16" x2="12" y2="12"/>
          <line x1="12" y1="8" x2="12.01" y2="8"/>
        </svg>
      </div>
      <h2 class="empty-title">Select a Student</h2>
      <p class="empty-desc">
        Choose a student above to inspect their earned milestone stars, pending achievements, and full audit event history.
      </p>
    </div>

    <!-- Student Star Chart View -->
    <div v-else class="chart-content-layout">
      <!-- Top Student Meta Card -->
      <div class="student-profile-strip">
        <div class="student-meta-left">
          <div class="avatar-box">
            <img v-if="activeStudent.avatar" :src="activeStudent.avatar" :alt="activeStudent.name" />
            <span v-else>{{ (activeStudent.name || 'S').charAt(0).toUpperCase() }}</span>
          </div>
          <div>
            <h2 class="student-headline">{{ activeStudent.name }}</h2>
            <span class="student-details-sub">
              {{ activeStudent.email }} • {{ activeStudent.section_name }} ({{ activeStudent.section_code }})
            </span>
          </div>
        </div>

        <div class="student-stars-summary">
          <div class="star-badge-large">
            <span class="star-sym">★</span>
            <span class="star-count-num">{{ activeStarsCount }}</span>
            <span class="star-count-label">Earned Stars</span>
          </div>
        </div>
      </div>

      <!-- Two Main Columns: Earned Stars & Catalog (Left) vs Audit Log (Right) -->
      <div class="chart-columns-grid">
        <!-- Left: Available & Awarded Stars Catalog -->
        <div class="catalog-panel">
          <h3 class="panel-heading">Milestone Catalog & Student Achievements</h3>
          <p class="panel-sub">
            Review earned stars or award new milestone recognitions.
          </p>

          <div class="stars-cards-grid">
            <div 
              v-for="star in catalogWithStatus" 
              :key="star.id" 
              class="star-item-card"
              :class="{ 'is-earned': star.isEarned }"
            >
              <div class="star-card-header">
                <span class="star-icon" :class="{ 'text-gold': star.isEarned }">★</span>
                <span class="badge-category">{{ star.category }}</span>
              </div>

              <h4 class="star-title">{{ star.title }}</h4>
              <p class="star-desc">{{ star.description }}</p>

              <div class="star-card-footer">
                <span v-if="star.isEarned" class="earned-indicator">
                  ✓ Awarded on {{ formatDate(star.earnedAt) }}
                </span>
                <span v-else class="unearned-indicator">Available for Awarding</span>

                <div class="star-btn-group">
                  <button 
                    v-if="star.isEarned"
                    type="button" 
                    class="btn-revoke-star" 
                    @click="handleRevokeStar(star)"
                    title="Revoke star with mandatory reason note"
                  >
                    Revoke
                  </button>
                  <button 
                    v-else
                    type="button" 
                    class="btn-award-single" 
                    @click="handleAwardSpecificStar(star)"
                  >
                    Award Star
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Right: Immutable Audit Trail -->
        <div class="audit-panel">
          <div class="audit-head-row">
            <h3 class="panel-heading">Immutable Audit Trail</h3>
            <span class="badge-audit-count">{{ starChart.auditEvents.length }} Events</span>
          </div>
          <p class="panel-sub">
            Strict append-only record of all star awards and revocations for transparency.
          </p>

          <div v-if="starChart.auditEvents.length === 0" class="audit-empty-state">
            No audit events recorded for this student yet.
          </div>

          <div v-else class="audit-events-timeline">
            <div 
              v-for="evt in starChart.auditEvents" 
              :key="evt.id" 
              class="audit-event-card"
            >
              <div class="audit-event-top">
                <span 
                  class="action-badge" 
                  :class="evt.action === 'awarded' ? 'action-awarded' : 'action-revoked'"
                >
                  {{ evt.action.toUpperCase() }}
                </span>
                <span class="audit-time">{{ formatDate(evt.created_at) }}</span>
              </div>

              <div class="audit-star-title">
                Star: <strong>{{ getStarTitle(evt.star_id) }}</strong>
              </div>

              <div class="audit-note-box">
                "{{ evt.note }}"
              </div>

              <div class="audit-mentor-sub">
                Logged by: {{ evt.mentor_name || 'Assigned Mentor' }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

const props = defineProps({
  students: {
    type: Array,
    default: () => [],
  },
  starChart: {
    type: Object,
    default: () => ({ awards: [], auditEvents: [] }),
  },
  catalog: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(['select-student', 'open-star-modal']);

const selectedStudentId = ref('');

// Auto-select first student if available and none selected
watch(
  () => props.students,
  newStudents => {
    if (!selectedStudentId.value && newStudents.length > 0) {
      const firstId = newStudents[0].student_id || newStudents[0].id;
      selectedStudentId.value = firstId;
      emit('select-student', newStudents[0]);
    }
  },
  { immediate: true }
);

const activeStudent = computed(() => {
  return props.students.find(s => (s.student_id === selectedStudentId.value || s.id === selectedStudentId.value)) || null;
});

function handleStudentSelect(id) {
  selectedStudentId.value = id;
  const s = props.students.find(st => (st.student_id === id || st.id === id));
  if (s) {
    emit('select-student', s);
  }
}

function handleAwardStar() {
  if (!activeStudent.value) return;
  emit('open-star-modal', activeStudent.value, 'awarded');
}

function handleRevokeStar(star) {
  if (!activeStudent.value || !star) return;
  emit('open-star-modal', activeStudent.value, 'revoked', star);
}

function handleAwardSpecificStar(star) {
  if (!activeStudent.value || !star) return;
  emit('open-star-modal', activeStudent.value, 'awarded', star);
}

const activeStarsCount = computed(() => {
  return (props.starChart.awards || []).filter(a => a.status === 'awarded').length;
});

const catalogWithStatus = computed(() => {
  const awardsMap = new Map();
  (props.starChart.awards || []).forEach(a => {
    awardsMap.set(a.star_id, a);
  });

  return props.catalog.map(cat => {
    const award = awardsMap.get(cat.id);
    const isEarned = award && award.status === 'awarded';
    return {
      ...cat,
      isEarned,
      earnedAt: award ? award.updated_at || award.created_at : null,
      star_id: cat.id,
    };
  });
});

function getStarTitle(starId) {
  const match = props.catalog.find(c => c.id === starId);
  return match ? match.title : starId;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
</script>

<style scoped>
.star-charts-page {
  padding: 8px 12px 36px 8px;
  width: 100%;
  box-sizing: border-box;
}

.page-header {
  margin-bottom: 14px;
}

.page-title {
  font-family: var(--font-family-display, inherit);
  font-size: 22px;
  font-weight: 700;
  color: #111827;
  letter-spacing: -0.01em;
  margin: 0 0 3px 0;
}

.page-subtitle {
  font-size: 13px;
  color: #64748b;
  margin: 0;
}

/* Invariant Banner */
.invariant-banner {
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 8px;
  padding: 10px 14px;
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
}

.shield-icon-circle {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: #dbeafe;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.invariant-text { font-size: 12px; color: #1e40af; line-height: 1.4; }
.invariant-text strong { color: #1d4ed8; }

/* Selection Toolbar */
.selection-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #ffffff;
  border: 1px solid var(--border-card, #eef1f4);
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
  padding: 10px 14px;
  margin-bottom: 14px;
  gap: 14px;
  flex-wrap: wrap;
}

.selector-col {
  display: flex;
  align-items: center;
  gap: 8px;
}

.selector-label {
  font-size: 12px;
  font-weight: 600;
  color: #475569;
}

.student-dropdown {
  background: #ffffff;
  color: #111827;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  padding: 6px 10px;
  font-size: 12.5px;
  outline: none;
  min-width: 260px;
  cursor: pointer;
  transition: border-color 0.15s ease;
}

.student-dropdown:focus {
  border-color: var(--primary-orange, #F18701);
}

.btn-studio-primary {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: var(--primary-orange, #F18701);
  color: #ffffff;
  border: none;
  border-radius: 6px;
  padding: 7px 14px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(241, 135, 1, 0.2);
  transition: background 0.15s ease;
}

.btn-studio-primary:hover {
  background: #ea580c;
}

/* Empty State */
.charts-empty-state {
  background: #ffffff;
  border: 1px dashed #cbd5e1;
  border-radius: 12px;
  padding: 48px 24px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
}

.empty-icon-circle {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #f8fafc;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 10px;
}

.empty-title { font-size: 16px; font-weight: 700; color: #111827; margin: 0 0 4px 0; }
.empty-desc { font-size: 12.5px; color: #64748b; max-width: 480px; margin: 0; line-height: 1.45; }

/* Student Profile Strip */
.student-profile-strip {
  background: #ffffff;
  border: 1px solid var(--border-card, #eef1f4);
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.student-meta-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.avatar-box {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #ffedd5;
  border: 1px solid #fed7aa;
  color: #ea580c;
  font-size: 13px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.avatar-box img { width: 100%; height: 100%; object-fit: cover; }
.student-headline { font-size: 15px; font-weight: 700; color: #111827; margin: 0 0 2px 0; }
.student-details-sub { font-size: 11.5px; color: #64748b; }

.star-badge-large {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #fff7ed;
  border: 1px solid #fed7aa;
  padding: 6px 12px;
  border-radius: 8px;
}

.star-sym { color: #f59e0b; font-size: 16px; }
.star-count-num { font-size: 16px; font-weight: 800; color: #c2410c; }
.star-count-label { font-size: 11px; font-weight: 600; color: #7c2d12; }

/* 2 Columns Grid */
.chart-columns-grid {
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 14px;
}

@media (max-width: 1024px) {
  .chart-columns-grid {
    grid-template-columns: 1fr;
  }
}

.catalog-panel, .audit-panel {
  background: #ffffff;
  border: 1px solid var(--border-card, #eef1f4);
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
  padding: 16px;
}

.panel-heading {
  font-size: 14px;
  font-weight: 700;
  color: #111827;
  margin: 0 0 2px 0;
}

.panel-sub {
  font-size: 11.5px;
  color: #64748b;
  margin: 0 0 12px 0;
}

/* Stars Grid */
.stars-cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 10px;
}

.star-item-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  transition: all 0.12s ease;
}

.star-item-card.is-earned {
  border-color: #fed7aa;
  background: #fff7ed;
}

.star-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.star-icon {
  font-size: 16px;
  color: #94a3b8;
}

.text-gold { color: #f59e0b !important; }

.badge-category {
  font-size: 9.5px;
  font-weight: 600;
  color: #475569;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  padding: 1px 5px;
  border-radius: 4px;
}

.star-item-card.is-earned .badge-category {
  background: #fed7aa;
  color: #9a3412;
  border-color: #fdba74;
}

.star-title {
  font-size: 13px;
  font-weight: 700;
  color: #111827;
  margin: 0 0 3px 0;
}

.star-desc {
  font-size: 11px;
  color: #64748b;
  margin: 0 0 10px 0;
  line-height: 1.35;
  flex: 1;
}

.star-card-footer {
  border-top: 1px solid #e2e8f0;
  padding-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.star-item-card.is-earned .star-card-footer {
  border-top-color: #fed7aa;
}

.earned-indicator { font-size: 10.5px; color: #059669; font-weight: 600; }
.unearned-indicator { font-size: 10.5px; color: #64748b; }

.star-btn-group {
  display: flex;
  gap: 6px;
}

.btn-award-single {
  flex: 1;
  background: #fff7ed;
  border: 1px solid #fed7aa;
  color: #ea580c;
  border-radius: 5px;
  padding: 4px 8px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.12s ease;
}

.btn-award-single:hover {
  background: var(--primary-orange, #F18701);
  border-color: var(--primary-orange, #F18701);
  color: #ffffff;
}

.btn-revoke-star {
  background: #ffffff;
  border: 1px solid #fecaca;
  color: #dc2626;
  border-radius: 5px;
  padding: 4px 8px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.12s ease;
}

.btn-revoke-star:hover {
  background: #fef2f2;
}

/* Audit Panel */
.audit-head-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.badge-audit-count {
  font-size: 10.5px;
  color: #475569;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  padding: 1px 7px;
  border-radius: 999px;
  font-weight: 600;
}

.audit-empty-state {
  font-size: 12px;
  color: #64748b;
  text-align: center;
  padding: 28px 0;
}

.audit-events-timeline {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 480px;
  overflow-y: auto;
}

.audit-event-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 10px 12px;
}

.audit-event-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}

.action-badge {
  font-size: 9.5px;
  font-weight: 800;
  padding: 1px 5px;
  border-radius: 4px;
}

.action-awarded { background: #ecfdf5; color: #059669; border: 1px solid #a7f3d0; }
.action-revoked { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }

.audit-time { font-size: 10px; color: #9ca3af; }
.audit-star-title { font-size: 11.5px; color: #111827; margin-bottom: 4px; }
.audit-note-box {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-left: 3px solid var(--primary-orange, #F18701);
  padding: 6px 8px;
  font-size: 11px;
  color: #374151;
  font-style: italic;
  margin-bottom: 4px;
  border-radius: 3px;
}

.audit-mentor-sub { font-size: 10px; color: #64748b; }
</style>