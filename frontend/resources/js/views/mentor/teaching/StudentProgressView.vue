<!-- frontend/resources/js/views/mentor/teaching/StudentProgressView.vue -->
<template>
  <div class="student-progress-page">
    <header class="page-header">
      <div>
        <h1 class="page-title">Student Progress Monitoring</h1>
        <p class="page-subtitle">
          Real-time telemetry and checkpoint tracking across all enrolled cohorts.
        </p>
      </div>
    </header>

    <!-- Filter & Search Toolbar -->
    <div class="toolbar-box">
      <!-- Search Input -->
      <div class="search-input-wrap">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input 
          v-model="searchQuery" 
          type="text" 
          class="toolbar-search-input" 
          placeholder="Filter by student name, email, or checkpoint..."
        />
      </div>

      <!-- Section Filter -->
      <div class="filter-item">
        <label for="filter-sec" class="filter-label">Class:</label>
        <select id="filter-sec" v-model="sectionFilter" class="toolbar-select">
          <option value="all">All Assigned Classes</option>
          <option v-for="sec in sections" :key="sec.id" :value="sec.id">
            {{ sec.name }} ({{ sec.code }})
          </option>
        </select>
      </div>

      <!-- Status Filter -->
      <div class="filter-item">
        <label for="filter-stat" class="filter-label">Status:</label>
        <select id="filter-stat" v-model="statusFilter" class="toolbar-select">
          <option value="all">All Learning Statuses</option>
          <option value="active">Active</option>
          <option value="needs_assistance">Needs Assistance</option>
          <option value="struggling">Struggling</option>
          <option value="completed">Completed</option>
        </select>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="filteredStudents.length === 0" class="students-empty-state">
      <div class="empty-icon-circle">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#64748b" stroke-width="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      </div>
      <h2 class="empty-title">No Students Found</h2>
      <p class="empty-desc">
        {{ students.length === 0 
          ? 'No students currently enrolled in your assigned sections.' 
          : 'No students match your active filter or search criteria.' 
        }}
      </p>
    </div>

    <!-- Student Table -->
    <div v-else class="table-container">
      <table class="progress-table">
        <thead>
          <tr>
            <th>Learner</th>
            <th>Section</th>
            <th>Module & Checkpoint</th>
            <th>Progress</th>
            <th>Mastery</th>
            <th>Status</th>
            <th>Last Activity</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr 
            v-for="student in filteredStudents" 
            :key="student.student_id" 
            class="student-row"
            @click="$emit('open-student', student)"
          >
            <!-- Learner Col -->
            <td class="learner-col">
              <div class="avatar-sm">
                <img v-if="student.avatar" :src="student.avatar" :alt="student.name" />
                <span v-else>{{ (student.name || 'S').charAt(0).toUpperCase() }}</span>
              </div>
              <div class="learner-text-col">
                <span class="learner-name">{{ student.name }}</span>
                <span class="learner-email">{{ student.email }}</span>
              </div>
            </td>

            <!-- Section -->
            <td>
              <span class="sec-badge">{{ student.section_code }}</span>
            </td>

            <!-- Module & Checkpoint -->
            <td>
              <span class="mod-title">{{ student.current_module_title }}</span>
              <span class="cp-title">{{ student.current_checkpoint || 'Foundation Phase' }}</span>
            </td>

            <!-- Progress Bar -->
            <td class="progress-cell">
              <div class="progress-bar-wrap">
                <div class="mini-bar">
                  <div class="mini-fill" :style="{ width: `${student.module_progress}%` }"></div>
                </div>
                <span class="percent-num">{{ student.module_progress }}%</span>
              </div>
            </td>

            <!-- Concepts -->
            <td>
              <span class="badge-concepts">
                {{ student.mastered_concepts_count }} Concepts
              </span>
            </td>

            <!-- Status -->
            <td>
              <span class="status-badge" :class="`status-${student.learning_status}`">
                {{ formatStatus(student.learning_status) }}
              </span>
            </td>

            <!-- Last Activity -->
            <td>
              <span class="time-text">{{ formatTimeAgo(student.last_activity) }}</span>
            </td>

            <!-- Action -->
            <td class="actions-cell" @click.stop>
              <button 
                type="button" 
                class="btn-table-action" 
                @click="$emit('open-student', student)"
                title="View detailed student progress & star chart"
              >
                Inspect
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  students: {
    type: Array,
    default: () => [],
  },
  sections: {
    type: Array,
    default: () => [],
  },
});

defineEmits(['open-student']);

const searchQuery = ref('');
const sectionFilter = ref('all');
const statusFilter = ref('all');

const filteredStudents = computed(() => {
  let list = props.students;

  if (sectionFilter.value !== 'all') {
    list = list.filter(s => s.section_id === sectionFilter.value);
  }

  if (statusFilter.value !== 'all') {
    list = list.filter(s => s.learning_status === statusFilter.value);
  }

  if (searchQuery.value && searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase().trim();
    list = list.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q) ||
      (s.current_checkpoint && s.current_checkpoint.toLowerCase().includes(q))
    );
  }

  return list;
});

function formatStatus(status) {
  if (status === 'completed') return 'Completed';
  if (status === 'struggling') return 'Struggling';
  if (status === 'needs_assistance') return 'Needs Assistance';
  return 'Active';
}

function formatTimeAgo(dateStr) {
  if (!dateStr) return 'Recently';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
</script>

<style scoped>
.student-progress-page {
  padding: 8px 12px 36px 8px;
  width: 100%;
  box-sizing: border-box;
}

.page-header {
  margin-bottom: 16px;
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

/* Toolbar */
.toolbar-box {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #ffffff;
  border: 1px solid var(--border-card, #eef1f4);
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
  padding: 10px 14px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.search-input-wrap {
  flex: 1;
  min-width: 240px;
  display: flex;
  align-items: center;
  gap: 8px;
  background: #ffffff;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  padding: 6px 10px;
  color: #64748b;
  transition: border-color 0.15s ease;
}

.search-input-wrap:focus-within {
  border-color: var(--primary-orange, #F18701);
  box-shadow: 0 0 0 2px rgba(241, 135, 1, 0.12);
}

.toolbar-search-input {
  background: transparent;
  border: none;
  color: #111827;
  font-size: 12.5px;
  width: 100%;
  outline: none;
  font-family: inherit;
}

.filter-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.filter-label {
  font-size: 11.5px;
  font-weight: 600;
  color: #475569;
}

.toolbar-select {
  background: #ffffff;
  color: #111827;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  padding: 6px 10px;
  font-size: 12.5px;
  outline: none;
  cursor: pointer;
  transition: border-color 0.15s ease;
}

.toolbar-select:focus {
  border-color: var(--primary-orange, #F18701);
}

/* Empty State */
.students-empty-state {
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

/* Table */
.table-container {
  background: #ffffff;
  border: 1px solid var(--border-card, #eef1f4);
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
  overflow: hidden;
}

.progress-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

.progress-table th {
  background: #f9fafb;
  font-size: 10.5px;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 8px 12px;
  border-bottom: 1px solid #e5e7eb;
}

.student-row {
  cursor: pointer;
  transition: background 0.12s ease;
}

.student-row:hover {
  background: #f8fafc;
}

.progress-table td {
  padding: 8px 12px;
  border-bottom: 1px solid #f1f5f9;
  font-size: 12px;
  color: #374151;
  vertical-align: middle;
}

.learner-col {
  display: flex;
  align-items: center;
  gap: 10px;
}

.avatar-sm {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #ffedd5;
  border: 1px solid #fed7aa;
  color: #ea580c;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  flex-shrink: 0;
  overflow: hidden;
}

.avatar-sm img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.learner-text-col {
  display: flex;
  flex-direction: column;
}

.learner-name {
  font-size: 12.5px;
  font-weight: 600;
  color: #111827;
}

.learner-email {
  font-size: 10.5px;
  color: #64748b;
}

.sec-badge {
  font-size: 10.5px;
  font-weight: 700;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  padding: 2px 7px;
  border-radius: 4px;
  color: #334155;
}

.mod-title {
  display: block;
  font-weight: 600;
  color: #111827;
  font-size: 12px;
}

.cp-title {
  display: block;
  font-size: 10.5px;
  color: #64748b;
}

.progress-cell {
  min-width: 120px;
}

.progress-bar-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
}

.mini-bar {
  flex: 1;
  height: 5px;
  background: #f1f5f9;
  border-radius: 999px;
  overflow: hidden;
}

.mini-fill {
  height: 100%;
  background: var(--primary-orange, #F18701);
  border-radius: 999px;
}

.percent-num {
  font-size: 10.5px;
  font-weight: 700;
  color: #111827;
  min-width: 28px;
}

.badge-concepts {
  font-size: 10.5px;
  font-weight: 600;
  color: #047857;
  background: #ecfdf5;
  border: 1px solid #a7f3d0;
  padding: 2px 7px;
  border-radius: 4px;
}

.status-badge {
  font-size: 10px;
  font-weight: 600;
  padding: 2px 7px;
  border-radius: 4px;
  display: inline-block;
}

.status-active { background: #eff6ff; color: #2563eb; border: 1px solid #bfdbfe; }
.status-needs_assistance { background: #fffbeb; color: #d97706; border: 1px solid #fde68a; }
.status-struggling { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
.status-completed { background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; }

.time-text {
  font-size: 10.5px;
  color: #64748b;
}

.btn-table-action {
  background: #ffffff;
  border: 1px solid #d1d5db;
  color: #374151;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 11.5px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.12s ease;
}

.btn-table-action:hover {
  background: #fff7ed;
  border-color: var(--primary-orange, #F18701);
  color: var(--primary-orange, #F18701);
}
</style>