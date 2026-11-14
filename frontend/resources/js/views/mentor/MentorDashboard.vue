<!-- frontend/resources/js/views/mentor/MentorDashboard.vue -->
<template>
  <div class="mentor-dashboard-page">
    <!-- Compact Header with Term Badge and Primary Actions -->
    <header class="dashboard-header">
      <div class="header-left">
        <div class="title-row">
          <h1 class="dashboard-title">Instructor Cockpit</h1>
          <span class="term-badge">AY 2026–2027 • Term 1</span>
        </div>
        <p class="dashboard-subtitle">
          Real-time cohort telemetry, section summaries, and curriculum tracking.
        </p>
      </div>

      <div class="header-actions">
        <button 
          type="button" 
          class="btn-studio-secondary" 
          @click="$emit('navigate', 'materials')"
          title="Upload learning materials"
        >
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          Upload Material
        </button>
      </div>
    </header>

    <!-- Error State with Retry CTA -->
    <div v-if="dashboardError" class="dashboard-error-banner">
      <div class="error-msg-row">
        <svg class="error-svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <div>
          <strong class="error-heading">Database Telemetry Unavailable</strong>
          <p class="error-details">{{ dashboardError }}</p>
        </div>
      </div>
      <button 
        type="button" 
        class="btn-retry" 
        @click="$emit('retry')"
      >
        Retry Connection
      </button>
    </div>

    <!-- Loading State -->
    <div v-else-if="isLoading" class="dashboard-loading-state">
      <div class="spinner-pulse"></div>
      <span class="loading-text">Synchronizing telemetry with database records...</span>
    </div>

    <!-- Real DB Metrics Content -->
    <div v-else class="dashboard-body">
      <!-- 4 Top KPI Metric Cards (Single Consistent Row) -->
      <div class="metrics-grid">
        <!-- Card 1: Total Enrolled Students -->
        <div class="metric-card">
          <div class="card-head">
            <span class="metric-label">Assigned Students</span>
            <div class="icon-bubble icon-blue">
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
          </div>
          <div class="metric-value">{{ metrics.total_enrolled_students }}</div>
          <div class="card-foot">
            <span v-if="metrics.total_enrolled_students > 0" class="foot-highlight text-blue">
              Enrolled in active cohorts
            </span>
            <span v-else class="foot-highlight text-muted">
              No students enrolled yet
            </span>
          </div>
        </div>

        <!-- Card 2: Active Courses -->
        <div class="metric-card">
          <div class="card-head">
            <span class="metric-label">Active Courses</span>
            <div class="icon-bubble icon-orange">
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/>
                <path d="M6 6h10"/>
                <path d="M6 10h10"/>
              </svg>
            </div>
          </div>
          <div class="metric-value">{{ metrics.total_courses }}</div>
          <div class="card-foot">
            <span v-if="metrics.total_courses > 0" class="foot-highlight text-orange">
              {{ metrics.total_courses }} configured track{{ metrics.total_courses > 1 ? 's' : '' }}
            </span>
            <span v-else class="foot-highlight text-muted">
              Draft your first curriculum
            </span>
          </div>
        </div>

        <!-- Card 3: Active Sections -->
        <div class="metric-card">
          <div class="card-head">
            <span class="metric-label">Active Sections</span>
            <div class="icon-bubble icon-purple">
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              </svg>
            </div>
          </div>
          <div class="metric-value">{{ metrics.total_sections }}</div>
          <div class="card-foot">
            <span v-if="metrics.total_sections > 0" class="foot-highlight text-purple">
              {{ sections.map(s => s.code).join(', ') || 'Classes connected' }}
            </span>
            <span v-else class="foot-highlight text-muted">
              No classes assigned to account
            </span>
          </div>
        </div>

        <!-- Card 4: Students Needing Attention -->
        <div class="metric-card">
          <div class="card-head">
            <span class="metric-label">Needing Attention</span>
            <div class="icon-bubble" :class="metrics.students_needing_attention.length > 0 ? 'icon-amber' : 'icon-green'">
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
          </div>
          <div class="metric-value" :class="{ 'text-amber': metrics.students_needing_attention.length > 0 }">
            {{ metrics.students_needing_attention.length }}
          </div>
          <div class="card-foot">
            <span v-if="metrics.students_needing_attention.length > 0" class="foot-highlight text-amber">
              {{ metrics.students_needing_attention.length }} learner{{ metrics.students_needing_attention.length > 1 ? 's' : '' }} flagged
            </span>
            <span v-else class="foot-highlight text-green">
              All learners on track
            </span>
          </div>
        </div>
      </div>

      <!-- Main Dashboard Content Grid -->
      <div class="dashboard-columns-grid">
        <!-- Left Column: Student Progress Overview & Students Needing Attention -->
        <div class="grid-column">
          <!-- 1. Student Progress Overview -->
          <div class="cockpit-panel">
            <div class="panel-header">
              <div class="panel-title-group">
                <h2 class="panel-title">Student Progress Overview</h2>
              </div>
              <button 
                type="button" 
                class="panel-action-link" 
                @click="$emit('navigate', 'students')"
              >
                Progress Matrix →
              </button>
            </div>

            <div class="progress-overview-box">
              <div class="progress-meta-row">
                <span class="progress-meta-label">Average Cohort Progress</span>
                <span class="progress-meta-value">{{ metrics.average_progress }}%</span>
              </div>
              <div class="compact-progress-track">
                <div class="compact-progress-fill" :style="{ width: `${metrics.average_progress}%` }"></div>
              </div>
              <div class="progress-stats-row">
                <div class="stat-pill">
                  <span class="stat-dot dot-active"></span>
                  <span class="stat-text">{{ metrics.total_enrolled_students }} Enrolled</span>
                </div>
                <div class="stat-pill">
                  <span class="stat-dot dot-amber"></span>
                  <span class="stat-text">{{ metrics.students_needing_attention.length }} Intervention</span>
                </div>
                <div class="stat-pill">
                  <span class="stat-dot dot-green"></span>
                  <span class="stat-text">{{ Math.max(0, metrics.total_enrolled_students - metrics.students_needing_attention.length) }} On Track</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 2. Students Needing Attention -->
          <div class="cockpit-panel">
            <div class="panel-header">
              <div class="panel-title-group">
                <h2 class="panel-title">Students Requiring Attention</h2>
                <span class="badge-count badge-amber">
                  {{ metrics.students_needing_attention.length }}
                </span>
              </div>
              <button 
                type="button" 
                class="panel-action-link" 
                @click="$emit('navigate', 'students')"
              >
                View Roster →
              </button>
            </div>

            <!-- Empty State when all students are on track or no students enrolled -->
            <div v-if="metrics.students_needing_attention.length === 0" class="panel-empty-state">
              <div class="empty-icon-circle">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#16a34a" stroke-width="2.2">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <h3 class="empty-title">All Learners On Track</h3>
              <p class="empty-desc">
                {{ metrics.total_enrolled_students > 0 
                  ? 'No students currently flagged as struggling or needing intervention.' 
                  : 'No student records enrolled in your assigned sections yet.' 
                }}
              </p>
            </div>

            <!-- List of Students Needing Attention -->
            <div v-else class="attention-list">
              <div 
                v-for="s in metrics.students_needing_attention" 
                :key="s.student_id" 
                class="attention-row"
                @click="$emit('open-student', s)"
              >
                <div class="attention-student-meta">
                  <div class="student-avatar-sm">
                    <img v-if="s.avatar" :src="s.avatar" :alt="s.name" />
                    <span v-else>{{ (s.name || 'S').charAt(0).toUpperCase() }}</span>
                  </div>
                  <div class="student-info-col">
                    <span class="student-name-text">{{ s.name }}</span>
                    <span class="student-section-sub">{{ s.section_name }} • {{ s.current_module_title }}</span>
                  </div>
                </div>

                <div class="attention-status-col">
                  <span class="status-tag" :class="`tag-${s.learning_status}`">
                    {{ s.learning_status === 'struggling' ? 'Struggling' : 'Needs Assistance' }}
                  </span>
                  <span class="progress-percent-sub">{{ s.module_progress }}% Progress</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Column: Course & Section Summaries & Recent Student Activity -->
        <div class="grid-column">
          <!-- 3. Course and Section Summaries -->
          <div class="cockpit-panel">
            <div class="panel-header">
              <div class="panel-title-group">
                <h2 class="panel-title">Assigned Classes & Sections</h2>
                <span class="badge-count">{{ sections.length }}</span>
              </div>
              <button 
                type="button" 
                class="panel-action-link" 
                @click="$emit('navigate', 'classes')"
              >
                View Classes →
              </button>
            </div>

            <div v-if="sections.length === 0" class="panel-empty-state">
              <div class="empty-icon-circle">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#6b7280" stroke-width="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                </svg>
              </div>
              <h3 class="empty-title">No Classes Assigned</h3>
              <p class="empty-desc">Sections assigned to your mentor account will be summarized here.</p>
            </div>

            <div v-else class="sections-summary-list">
              <div 
                v-for="sec in sections" 
                :key="sec.id" 
                class="section-summary-row"
                @click="$emit('navigate', 'classes')"
              >
                <div class="sec-summary-left">
                  <span class="sec-code-badge">{{ sec.code }}</span>
                  <div class="sec-summary-info">
                    <span class="sec-summary-name">{{ sec.name }}</span>
                    <span class="sec-summary-school">{{ sec.school }} • {{ sec.grade_level }}</span>
                  </div>
                </div>
                <div class="sec-summary-right">
                  <span class="sec-roster-count">{{ sec.student_count || 0 }} Learners</span>
                  <span class="sec-arrow">→</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 4. Recent Student Activity -->
          <div class="cockpit-panel">
            <div class="panel-header">
              <div class="panel-title-group">
                <h2 class="panel-title">Recent Student Activity</h2>
                <span class="badge-count">{{ metrics.recently_active_students.length }}</span>
              </div>
              <button 
                type="button" 
                class="panel-action-link" 
                @click="$emit('navigate', 'students')"
              >
                All Learners →
              </button>
            </div>

            <!-- Empty State -->
            <div v-if="metrics.recently_active_students.length === 0" class="panel-empty-state">
              <div class="empty-icon-circle">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#6b7280" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="6" x2="12" y2="12"/>
                  <line x1="12" y1="12" x2="16" y2="14"/>
                </svg>
              </div>
              <h3 class="empty-title">No Recent Telemetry</h3>
              <p class="empty-desc">
                Enrolled students will appear here as they engage in laboratory checkpoints.
              </p>
            </div>

            <!-- Active Students List -->
            <div v-else class="active-students-list">
              <div 
                v-for="s in metrics.recently_active_students" 
                :key="s.student_id" 
                class="active-student-row"
                @click="$emit('open-student', s)"
              >
                <div class="active-student-left">
                  <div class="student-avatar-sm">
                    <img v-if="s.avatar" :src="s.avatar" :alt="s.name" />
                    <span v-else>{{ (s.name || 'S').charAt(0).toUpperCase() }}</span>
                  </div>
                  <div class="student-info-col">
                    <span class="student-name-text">{{ s.name }}</span>
                    <span class="student-checkpoint-sub">{{ s.current_checkpoint || 'Active in module' }}</span>
                  </div>
                </div>

                <div class="active-student-right">
                  <span class="badge-mastered-concepts">{{ s.mastered_concepts_count }} Mastered</span>
                  <span class="last-seen-text">{{ formatTimeAgo(s.last_activity) }}</span>
                </div>
              </div>
            </div>

            <!-- Recent Course Activity Timeline -->
            <div class="recent-activity-section">
              <h3 class="sub-panel-title">Course Event Log</h3>
              <div v-if="metrics.recent_course_activity.length === 0" class="text-muted-sub">
                No recent curriculum or course events recorded.
              </div>
              <div v-else class="activity-timeline">
                <div v-for="act in metrics.recent_course_activity" :key="act.id" class="activity-item">
                  <span class="activity-dot"></span>
                  <div class="activity-body">
                    <span class="activity-title-text">{{ act.title }}</span>
                    <span class="activity-time-sub">{{ formatTimeAgo(act.timestamp) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Shortcuts Banner if No Courses Created Yet -->
      <div v-if="metrics.total_courses === 0" class="empty-courses-onboarding-card">
        <div class="onboarding-text">
          <h3 class="onboarding-title">Get Started by Building Your First Course</h3>
          <p class="onboarding-desc">
            Organize learning modules, attach lab documents (PDFs, DOCX, Markdown), and use the AI Curriculum Designer to personalize learning objectives.
          </p>
        </div>
        <button 
          type="button" 
          class="btn-studio-primary" 
          @click="$emit('navigate', 'create-course')"
        >
          Create First Course →
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  metrics: {
    type: Object,
    required: true,
  },
  sections: {
    type: Array,
    default: () => [],
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
  dashboardError: {
    type: String,
    default: null,
  },
});

defineEmits(['navigate', 'open-student', 'retry']);

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
.mentor-dashboard-page {
  padding: 8px 12px 36px 8px;
  width: 100%;
  box-sizing: border-box;
}

.dashboard-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  gap: 14px;
  flex-wrap: wrap;
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.title-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.dashboard-title {
  font-family: var(--font-family-display, inherit);
  font-size: 22px;
  font-weight: 700;
  color: var(--text-heading, #111827);
  letter-spacing: -0.01em;
  margin: 0;
}

.term-badge {
  font-size: 11px;
  font-weight: 600;
  background: #f1f5f9;
  color: #475569;
  border: 1px solid #e2e8f0;
  padding: 2px 8px;
  border-radius: 6px;
  letter-spacing: 0.02em;
}

.dashboard-subtitle {
  font-size: 13px;
  color: var(--text-muted, #64748b);
  margin: 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-studio-primary {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: var(--primary-orange, #F18701);
  color: #ffffff;
  border: none;
  border-radius: 8px;
  padding: 7px 14px;
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(241, 135, 1, 0.2);
  transition: all 0.15s ease;
}

.btn-studio-primary:hover {
  background: var(--primary-orange-hover, #ff8c1a);
}

.btn-studio-secondary {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #ffffff;
  color: #374151;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 7px 14px;
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-studio-secondary:hover {
  background: #f9fafb;
  border-color: #9ca3af;
  color: #111827;
}

/* Error Banner */
.dashboard-error-banner {
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 10px;
  padding: 14px 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  gap: 16px;
}

.error-msg-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.error-svg {
  color: #dc2626;
  flex-shrink: 0;
}

.error-heading {
  font-size: 14px;
  color: #b91c1c;
  display: block;
}

.error-details {
  font-size: 12px;
  color: #dc2626;
  margin: 2px 0 0 0;
}

.btn-retry {
  background: #dc2626;
  color: #fff;
  border: none;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}

/* Loading State */
.dashboard-loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  gap: 12px;
}

.spinner-pulse {
  width: 30px;
  height: 30px;
  border: 3px solid rgba(241, 135, 1, 0.2);
  border-top-color: var(--primary-orange, #F18701);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-text {
  font-size: 13px;
  color: var(--text-muted, #64748b);
}

/* Single Consistent Row of 4 Compact Metric Cards */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
  margin-bottom: 16px;
}

@media (max-width: 900px) {
  .metrics-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.metric-card {
  background: #ffffff;
  border: 1px solid var(--border-card, #eef1f4);
  border-radius: 12px;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.metric-card:hover {
  border-color: #cbd5e1;
}

.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.metric-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-muted, #64748b);
}

.icon-bubble {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-blue { background: #eff6ff; color: #2563eb; }
.icon-orange { background: #fff7ed; color: #ea580c; }
.icon-purple { background: #faf5ff; color: #9333ea; }
.icon-green { background: #f0fdf4; color: #16a34a; }
.icon-amber { background: #fffbeb; color: #d97706; }

.metric-value {
  font-family: var(--font-family-display, inherit);
  font-size: 24px;
  font-weight: 800;
  color: var(--primary-orange, #F18701);
  line-height: 1.1;
  margin-bottom: 4px;
}

.metric-value.text-amber {
  color: #d97706;
}

.card-foot {
  font-size: 11.5px;
  color: var(--text-muted, #64748b);
}

.foot-highlight {
  font-weight: 500;
}

.text-blue { color: #2563eb; }
.text-orange { color: #c2410c; }
.text-purple { color: #7e22ce; }
.text-green { color: #15803d; }
.text-amber { color: #b45309; }
.text-muted { color: #64748b; }

/* Responsive Grid (2 Columns) */
.dashboard-columns-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  margin-bottom: 16px;
}

@media (max-width: 960px) {
  .dashboard-columns-grid {
    grid-template-columns: 1fr;
  }
}

.grid-column {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.cockpit-panel {
  background: #ffffff;
  border: 1px solid var(--border-card, #eef1f4);
  border-radius: 12px;
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.panel-title-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.panel-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-heading, #111827);
  margin: 0;
}

.badge-count {
  font-size: 10.5px;
  font-weight: 700;
  padding: 1px 7px;
  border-radius: 999px;
  background: #f1f5f9;
  color: #475569;
}

.badge-amber {
  background: #fef3c7;
  color: #b45309;
}

.panel-action-link {
  background: transparent;
  border: none;
  font-size: 11.5px;
  font-weight: 600;
  color: var(--primary-orange, #F18701);
  cursor: pointer;
  padding: 0;
}

.panel-action-link:hover {
  text-decoration: underline;
}

/* Progress Overview Box */
.progress-overview-box {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.progress-meta-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.progress-meta-label {
  font-size: 12px;
  color: #64748b;
  font-weight: 500;
}

.progress-meta-value {
  font-size: 13px;
  font-weight: 700;
  color: #111827;
}

.compact-progress-track {
  width: 100%;
  height: 6px;
  background: #f1f5f9;
  border-radius: 999px;
  overflow: hidden;
}

.compact-progress-fill {
  height: 100%;
  background: var(--primary-orange, #F18701);
  border-radius: 999px;
  transition: width 0.3s ease;
}

.progress-stats-row {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 4px;
}

.stat-pill {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11.5px;
  color: #475569;
}

.stat-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.dot-active { background: #2563eb; }
.dot-amber { background: #f59e0b; }
.dot-green { background: #10b981; }

/* Panel Empty State */
.panel-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px 16px;
  text-align: center;
}

.empty-icon-circle {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #f8fafc;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
}

.empty-title {
  font-size: 13.5px;
  font-weight: 700;
  color: #111827;
  margin: 0 0 2px 0;
}

.empty-desc {
  font-size: 12px;
  color: #64748b;
  margin: 0;
  max-width: 280px;
  line-height: 1.4;
}

/* Attention List */
.attention-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.attention-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  background: #ffffff;
  border: 1px solid #f1f5f9;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.12s ease;
}

.attention-row:hover {
  background: #f8fafc;
  border-color: #fed7aa;
}

.attention-student-meta {
  display: flex;
  align-items: center;
  gap: 10px;
}

.student-avatar-sm {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #ffedd5;
  border: 1px solid #fed7aa;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  color: #ea580c;
  flex-shrink: 0;
  overflow: hidden;
}

.student-avatar-sm img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.student-info-col {
  display: flex;
  flex-direction: column;
}

.student-name-text {
  font-size: 12.5px;
  font-weight: 600;
  color: #111827;
}

.student-section-sub {
  font-size: 10.5px;
  color: #64748b;
}

.attention-status-col {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
}

.status-tag {
  font-size: 10px;
  font-weight: 600;
  padding: 1px 6px;
  border-radius: 4px;
}

.tag-struggling {
  background: #ffe4e6;
  color: #e11d48;
  border: 1px solid #fecdd3;
}

.tag-needs_assistance {
  background: #fef3c7;
  color: #b45309;
  border: 1px solid #fde68a;
}

.progress-percent-sub {
  font-size: 10.5px;
  color: #64748b;
}

/* Sections Summary List */
.sections-summary-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.section-summary-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  background: #ffffff;
  border: 1px solid #f1f5f9;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.12s ease;
}

.section-summary-row:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
}

.sec-summary-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.sec-code-badge {
  font-size: 10.5px;
  font-weight: 700;
  background: #fff7ed;
  color: #c2410c;
  border: 1px solid #fed7aa;
  padding: 2px 6px;
  border-radius: 4px;
}

.sec-summary-info {
  display: flex;
  flex-direction: column;
}

.sec-summary-name {
  font-size: 12.5px;
  font-weight: 600;
  color: #111827;
}

.sec-summary-school {
  font-size: 10.5px;
  color: #64748b;
}

.sec-summary-right {
  display: flex;
  align-items: center;
  gap: 6px;
}

.sec-roster-count {
  font-size: 11px;
  font-weight: 600;
  color: #475569;
}

.sec-arrow {
  font-size: 12px;
  color: #94a3b8;
}

/* Active Students List */
.active-students-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 14px;
}

.active-student-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  background: #ffffff;
  border: 1px solid #f1f5f9;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.12s ease;
}

.active-student-row:hover {
  background: #f8fafc;
  border-color: #fed7aa;
}

.active-student-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.student-checkpoint-sub {
  font-size: 10.5px;
  color: #64748b;
}

.active-student-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
}

.badge-mastered-concepts {
  font-size: 9.5px;
  font-weight: 600;
  background: #dcfce7;
  color: #15803d;
  border: 1px solid #bbf7d0;
  padding: 1px 5px;
  border-radius: 4px;
}

.last-seen-text {
  font-size: 10.5px;
  color: #94a3b8;
}

/* Recent Course Activity Timeline */
.recent-activity-section {
  border-top: 1px solid #f1f5f9;
  padding-top: 12px;
}

.sub-panel-title {
  font-size: 12px;
  font-weight: 700;
  color: #475569;
  margin: 0 0 8px 0;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.text-muted-sub {
  font-size: 11.5px;
  color: #94a3b8;
}

.activity-timeline {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.activity-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.activity-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--primary-orange, #F18701);
  margin-top: 5px;
  flex-shrink: 0;
}

.activity-body {
  display: flex;
  flex-direction: column;
}

.activity-title-text {
  font-size: 12px;
  font-weight: 500;
  color: #374151;
}

.activity-time-sub {
  font-size: 10px;
  color: #94a3b8;
}

/* Onboarding Card */
.empty-courses-onboarding-card {
  background: #fff7ed;
  border: 1px dashed #fed7aa;
  border-radius: 12px;
  padding: 18px 22px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.onboarding-title {
  font-size: 14px;
  font-weight: 700;
  color: #9a3412;
  margin: 0 0 2px 0;
}

.onboarding-desc {
  font-size: 12px;
  color: #c2410c;
  margin: 0;
  max-width: 600px;
  line-height: 1.4;
}
</style>

