<template>
  <div class="modules-page-wrapper">
    <!-- Header: Title & Action Controls -->
    <header class="modules-header">
      <h1 class="modules-title">Currently Enrolled</h1>
      
      <div class="modules-header-actions">
        <!-- Student Notifications Dropdown -->
        <div class="student-notif-wrapper" ref="studentNotifDropdownRef">
          <button 
            type="button" 
            class="btn-icon-notif" 
            @click="toggleStudentNotifs"
            title="Notifications"
            aria-label="Notifications"
            id="btn-student-notifications"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            <span v-if="unreadStudentNotifsCount > 0" class="student-notif-badge">
              {{ unreadStudentNotifsCount }}
            </span>
          </button>

          <!-- Notifications Dropdown Popover -->
          <transition name="dropdown-fade">
            <div v-if="isStudentNotifsOpen" class="student-notif-popover" @click.stop>
              <div class="student-notif-header">
                <span class="student-notif-header-title">Notifications</span>
                <span v-if="unreadStudentNotifsCount > 0" class="student-notif-unread-tag">
                  {{ unreadStudentNotifsCount }} new
                </span>
              </div>
              <div v-if="studentNotifications.length === 0" class="student-notif-empty">
                <span>No new notifications</span>
              </div>
              <div v-else class="student-notif-list">
                <div 
                  v-for="notif in studentNotifications" 
                  :key="notif.id" 
                  class="student-notif-item"
                  :class="{ 'is-unread': !notif.is_read }"
                  @click="handleStudentNotifClick(notif)"
                >
                  <div class="notif-dot-col">
                    <span v-if="notif.type === 'unenrollment_approved'" class="notif-approved-icon">✓</span>
                    <span v-else-if="notif.type === 'unenrollment_rejected'" class="notif-rejected-icon">✕</span>
                    <span v-else>🔔</span>
                  </div>
                  <div class="notif-body-col">
                    <span class="notif-headline">{{ notif.title }}</span>
                    <p class="notif-text">{{ notif.message }}</p>
                    <span class="notif-date">{{ formatNotifTime(notif.created_at) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </transition>
        </div>

        <!-- Favorites Filter Button -->
        <button 
          type="button" 
          class="btn-icon-star" 
          :class="{ 'is-active-filter': showOnlyFavorites }"
          @click="toggleFavoritesFilter"
          :title="showOnlyFavorites ? 'Show All Modules' : 'Filter Favorites'" 
          :aria-label="showOnlyFavorites ? 'Show All Modules' : 'Filter Favorites'"
          id="btn-filter-favorites"
        >
          <svg width="28" height="28" viewBox="0 0 24 24" :fill="showOnlyFavorites ? '#ff7a00' : '#1f2937'">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
        </button>

        <button 
          type="button" 
          class="btn-see-all" 
          id="btn-see-all"
          @click="handleSeeAll"
        >
          {{ showOnlyFavorites ? 'Show All' : 'See All' }}
        </button>
      </div>
    </header>

    <!-- Top Section: Currently Enrolled Cards Carousel (Max 4 Cards Visible) -->
    <div class="enrolled-carousel-wrapper">
      <!-- Left Gradient Prev Arrow (Visible past page 0) -->
      <button 
        v-if="currentEnrolledPage > 0" 
        type="button" 
        class="carousel-gradient-edge edge-prev" 
        @click="prevCarouselPage"
        title="Show previous enrolled cards" 
        aria-label="Previous cards"
        id="btn-carousel-prev"
      >
        <span class="carousel-chevron">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </span>
      </button>

      <!-- If no modules enrolled yet -->
      <div v-if="enrolledList.length === 0" class="enrolled-empty-container">
        <div class="empty-enrolled-box">
          <div class="empty-enrolled-badge">✦</div>
          <div class="empty-enrolled-content">
            <h3 class="empty-enrolled-title">No Enrolled Modules Yet</h3>
            <p class="empty-enrolled-text">
              Browse the catalog below and click <strong>Enroll</strong> on any available module to begin learning, track checkpoints, and unlock achievements!
            </p>
          </div>
        </div>
      </div>

      <!-- 4 Maximum Cards Grid with Slide Transition -->
      <div v-else class="enrolled-cards-viewport">
        <Transition :name="transitionName" mode="out-in">
          <div 
            :key="currentEnrolledPage" 
            class="enrolled-cards-grid" 
            id="enrolled-cards-container"
          >
            <div 
              v-for="enrolled in displayedEnrolledCards" 
              :key="enrolled.id"
              class="enrolled-card"
              :class="`card-${enrolled.theme || 'yellow'}`" 
              :id="`enrolled-card-${enrolled.id}`" 
              @click="$emit('open-module', enrolled)"
              role="button"
              tabindex="0"
              :title="`Open ${enrolled.title}`"
            >
              <div class="card-content-top">
                <div class="card-title-row">
                  <div class="card-title-badges-col">
                    <span v-if="enrolled.isPendingUnenrollment" class="badge-pending-pill">
                      ⏳ Pending Approval
                    </span>
                    <h3 class="enrolled-card-title">{{ enrolled.title }}</h3>
                  </div>
                  
                  <!-- Kebab menu button -->
                  <div class="card-kebab-wrapper" @click.stop>
                    <button 
                      type="button" 
                      class="btn-card-kebab" 
                      @click.stop="toggleCardMenu(enrolled.id)"
                      :class="{ 'is-menu-open': activeCardMenuId === enrolled.id }"
                      title="Module options"
                      :aria-label="`Options for ${enrolled.title}`"
                      :id="`btn-kebab-${enrolled.id}`"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <circle cx="12" cy="5" r="2.2"/>
                        <circle cx="12" cy="12" r="2.2"/>
                        <circle cx="12" cy="19" r="2.2"/>
                      </svg>
                    </button>

                    <!-- Dropdown Popover with Unenroll option -->
                    <transition name="dropdown-fade">
                      <div 
                        v-if="activeCardMenuId === enrolled.id" 
                        class="card-kebab-dropdown" 
                        @click.stop
                      >
                        <button 
                          v-if="enrolled.isPendingUnenrollment"
                          type="button" 
                          class="dropdown-item-disabled"
                          disabled
                        >
                          <span>⏳ Unenroll Pending</span>
                        </button>
                        <button 
                          v-else
                          type="button" 
                          class="dropdown-item-unenroll" 
                          @click.stop="promptUnenroll(enrolled)"
                          :id="`btn-unenroll-${enrolled.id}`"
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"/>
                            <line x1="6" y1="6" x2="18" y2="18"/>
                          </svg>
                          <span>Unenroll</span>
                        </button>
                      </div>
                    </transition>
                  </div>
                </div>
                <p class="enrolled-card-subtitle">{{ enrolled.subtitle }}</p>
              </div>

              <div class="enrolled-progress-row">
                <div class="progress-bar-track" :class="{ 'track-translucent': enrolled.theme !== 'yellow' }">
                  <div 
                    class="progress-bar-fill" 
                    :class="{
                      'fill-blue': enrolled.theme === 'yellow',
                      'fill-lavender': enrolled.theme === 'purple',
                      'fill-pink': enrolled.theme === 'pink'
                    }" 
                    :style="{ width: `${enrolled.progressPercent || 0}%` }"
                  ></div>
                </div>
                <span class="progress-ratio">{{ enrolled.currentStep }}/{{ enrolled.totalSteps }}</span>
              </div>
            </div>
          </div>
        </Transition>
      </div>

      <!-- Right Gradient Next Arrow (Visible when >4 enrolled modules exist) -->
      <button 
        v-if="totalPages > 1" 
        type="button" 
        class="carousel-gradient-edge edge-next" 
        @click="nextCarouselPage"
        :title="currentEnrolledPage < totalPages - 1 ? 'Show next 4 enrolled cards' : 'Back to first cards'" 
        aria-label="Next cards"
        id="btn-carousel-next"
      >
        <span class="carousel-chevron">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </span>
      </button>
    </div>

    <!-- Explore Header Row -->
    <div class="explore-header-row">
      <div class="explore-heading-group">
        <h2 class="explore-heading">Explore</h2>
        <span v-if="showOnlyFavorites" class="filter-indicator-badge">Favorites Filter Active</span>
      </div>

      <div class="explore-toolbar">
        <div v-if="showSearch" class="explore-search-wrap">
          <input
            v-model="searchQuery"
            type="search"
            class="explore-search-input"
            placeholder="Search modules..."
          />
        </div>

        <button 
          type="button" 
          class="toolbar-btn" 
          :class="{ 'is-active': showSearch }"
          title="Search Modules" 
          aria-label="Search Modules"
          @click="showSearch = !showSearch"
        >
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M10 10h4"/>
            <path d="M19 7V4a1 1 0 0 0-1-1h-2a1 1 0 0 0-1 1v3"/>
            <path d="M20 21a2 2 0 0 0 2-2v-3.851c0-1.39-2-2.962-2-4.829V8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v11a2 2 0 0 0 2 2z"/>
            <path d="M4 21a2 2 0 0 1-2-2v-3.851c0-1.39 2-2.962 2-4.829V8a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v11a2 2 0 0 1-2 2z"/>
            <path d="M9 7V4a1 1 0 0 0-1-1H6a1 1 0 0 0-1 1v3"/>
          </svg>
        </button>

        <button type="button" class="toolbar-btn" title="Filter" aria-label="Filter" @click="toggleFavoritesFilter">
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="4" x2="20" y1="6" y2="6"/>
            <line x1="8" x2="16" y1="12" y2="12"/>
            <line x1="11" x2="13" y1="18" y2="18"/>
          </svg>
        </button>

        <button type="button" class="toolbar-btn" title="Sort" aria-label="Sort">
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="7 10 12 5 17 10"/>
            <line x1="12" x2="12" y1="5" y2="19"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- Catalog Filter Tabs (All, Assigned Class Courses, Foundation) -->
    <div class="catalog-filter-bar">
      <button 
        type="button" 
        class="filter-pill-btn" 
        :class="{ 'is-active': activeCatalogFilter === 'all' }"
        @click="activeCatalogFilter = 'all'"
      >
        All Modules
      </button>
      <button 
        type="button" 
        class="filter-pill-btn" 
        :class="{ 'is-active': activeCatalogFilter === 'class-courses' }"
        @click="activeCatalogFilter = 'class-courses'"
      >
        Assigned Class Courses ({{ publishedClassModules.length }})
      </button>
      <button 
        type="button" 
        class="filter-pill-btn" 
        :class="{ 'is-active': activeCatalogFilter === 'foundation' }"
        @click="activeCatalogFilter = 'foundation'"
      >
        Foundation Curriculum
      </button>
    </div>

    <!-- Empty State for Assigned Class Courses -->
    <div v-if="activeCatalogFilter === 'class-courses' && publishedClassModules.length === 0" class="no-assigned-courses-card">
      <div class="empty-badge">✦</div>
      <div class="empty-info">
        <h4 class="empty-title">No courses assigned yet</h4>
        <p class="empty-desc">Your mentor's published courses will appear here once you are enrolled.</p>
      </div>
    </div>

    <!-- THE ONLY SCROLLABLE AREA: Explore Modules List -->
    <div class="explore-scroll-container" id="explore-scroll-area">
      <div class="explore-modules-list">
        <!-- Loading State -->
        <div v-if="isLoadingModules" class="modules-loading-card" id="modules-loading-indicator">
          <div class="modules-spinner"></div>
          <p class="modules-loading-text">Loading curriculum modules from database...</p>
        </div>

        <!-- Query Error State with Retry Button -->
        <div v-else-if="loadError" class="modules-error-card" id="modules-error-indicator">
          <div class="modules-error-icon">⚠️</div>
          <div class="modules-error-body">
            <h4 class="modules-error-title">Unable to Load Modules</h4>
            <p class="modules-error-msg">{{ loadError }}</p>
          </div>
          <button type="button" class="btn-retry-load" id="btn-retry-modules" @click="loadModules">
            Retry
          </button>
        </div>

        <!-- Clean Database Empty State (When database legitimately returns 0 modules) -->
        <div v-else-if="modulesList.length === 0" class="no-modules-placeholder clean-empty-state" id="empty-modules-catalog">
          <div class="clean-empty-icon">✦</div>
          <h4 class="clean-empty-title">No learning modules are available yet</h4>
          <p class="clean-empty-desc">
            {{
              activeCatalogFilter === 'class-courses'
                ? 'Your teacher has not published any courses for your class section yet.'
                : activeCatalogFilter === 'foundation'
                ? 'No platform curriculum modules are currently published in the database.'
                : 'Your teacher has not published any courses for your class yet, and no platform curriculum modules are currently available.'
            }}
          </p>
        </div>

        <!-- Filter/Search Empty State (When modules exist in DB, but filtered out) -->
        <div v-else-if="displayedModules.length === 0" class="no-modules-placeholder">
          <p>No favorited or matching modules found.</p>
          <button type="button" class="btn-clear-filter" @click="showOnlyFavorites = false; searchQuery = ''">Show All Modules</button>
        </div>

        <!-- Real Database-Driven Module Cards -->
        <article 
          v-else
          v-for="module in displayedModules" 
          :key="module.id" 
          class="module-card-item"
          :class="{ 'is-expanded': expandedId === module.id }"
          :id="`module-item-${module.id}`"
        >
          <div class="module-thumbnail-box">
            <div class="thumbnail-inner">
              <span class="thumb-star-icon">✦</span>
            </div>
          </div>

          <div class="module-info-col">
            <div class="module-badges-row">
              <span class="level-pill" :class="`pill-${module.levelColor}`">{{ module.level }}</span>
              <span v-if="module.isTeacherAssigned" class="badge-type-pill pill-assigned">
                Teacher Assigned
              </span>
              <span v-else-if="module.enrollmentType === 'self_paced'" class="badge-type-pill pill-self-paced">
                Self-Paced
              </span>
              <span v-else class="badge-type-pill pill-curriculum">
                Curriculum
              </span>
              <span v-if="module.isPendingUnenrollment" class="badge-type-pill pill-pending-approval">
                Pending Approval
              </span>
            </div>

            <h3 class="module-title-text" :title="module.title">{{ module.title }}</h3>
            <p v-if="module.courseTitle && module.courseTitle !== module.title" class="module-course-subtitle">
              Course: {{ module.courseTitle }}
            </p>
            <p v-if="module.description" class="module-desc-text">
              {{ module.description }}
            </p>
          </div>

          <div class="module-skills-col">
            <p class="acquired-skills-text"><strong class="skills-lead">Skills:</strong> {{ module.skillsAcquired }}</p>
            <p class="badge-target-text"><strong class="badge-lead">Badge:</strong> {{ module.badge }}</p>
            <span class="steps-chip">{{ module.steps }}</span>
          </div>

          <div class="module-actions-col">
            <button 
              type="button" 
              class="module-expand-btn" 
              @click="toggleExpand(module.id)"
              :title="expandedId === module.id ? 'Collapse Details' : 'Expand Details'"
              :aria-label="expandedId === module.id ? 'Collapse Details' : 'Expand Details'"
              :class="{ 'is-expanded': expandedId === module.id }"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>

            <div class="actions-bottom-row">
              <button 
                type="button" 
                class="btn-favorite-toggle" 
                :class="{ 'is-favorited': module.isStarred }"
                @click.stop="toggleFavorite(module)"
                :title="module.isStarred ? 'Remove from favorites' : 'Add to favorites'"
                :aria-label="module.isStarred ? 'Remove from favorites' : 'Add to favorites'"
                :id="`btn-star-${module.id}`"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" :fill="module.isStarred ? '#ff7a00' : 'none'" :stroke="module.isStarred ? '#ff7a00' : 'currentColor'" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
              </button>

              <button 
                type="button" 
                class="btn-enroll-module" 
                :class="{ 
                  'btn-start': module.actionText === 'Start',
                  'btn-resume': module.actionText === 'Resume',
                  'btn-review': module.actionText === 'Review'
                }"
                @click="handleModuleClick(module)"
                :id="`btn-enroll-${module.id}`"
              >
                {{ module.actionText }}
              </button>
            </div>
          </div>

          <!-- Expandable drawer showing checkpoints -->
          <div v-if="expandedId === module.id" class="module-drawer-panel">
            <h5 class="drawer-title">Module Checkpoints & Syllabus</h5>
            <div v-if="module.checkpoints && module.checkpoints.length > 0" class="drawer-checkpoints-list">
              <div 
                v-for="(cp, cIdx) in module.checkpoints" 
                :key="cp.id || cIdx" 
                class="drawer-cp-item"
              >
                <span class="cp-num-pill">{{ cIdx + 1 }}</span>
                <div class="cp-detail-col">
                  <span class="cp-name">{{ cp.title || cp.name }}</span>
                  <span class="cp-type-badge">{{ cp.type }}</span>
                  <p v-if="cp.description" class="cp-desc">{{ cp.description }}</p>
                </div>
              </div>
            </div>
            <p v-else class="drawer-no-cp">Self-paced conceptual module with integrated guided checkpoints.</p>
          </div>
        </article>
      </div>
    </div>

    <!-- Self-Paced Unenrollment Confirmation Modal -->
    <div v-if="showSelfPacedUnenrollModal" class="modal-backdrop" @click="closeUnenrollModals">
      <div class="modal-card" @click.stop>
        <header class="modal-header">
          <h3 class="modal-title">Unenroll from Course</h3>
          <button type="button" class="btn-close-modal" @click="closeUnenrollModals">&times;</button>
        </header>
        <div class="modal-body">
          <p class="modal-desc">
            Are you sure you want to unenroll from <strong>{{ targetUnenrollModule?.title }}</strong>?
          </p>
          <div class="modal-info-box">
            <span>ℹ Your learning progress and completed checkpoints will be safely preserved in your academic record. You can re-enroll at any time.</span>
          </div>
        </div>
        <footer class="modal-footer">
          <button type="button" class="btn-modal-cancel" @click="closeUnenrollModals" :disabled="isSubmittingUnenroll">
            Cancel
          </button>
          <button 
            type="button" 
            class="btn-modal-danger" 
            :disabled="isSubmittingUnenroll"
            @click="confirmSelfPacedUnenroll"
            id="btn-confirm-self-paced-unenroll"
          >
            <span v-if="isSubmittingUnenroll">Unenrolling...</span>
            <span v-else>Confirm Unenroll</span>
          </button>
        </footer>
      </div>
    </div>

    <!-- Curriculum Unenrollment Request Modal -->
    <div v-if="showCurriculumUnenrollModal" class="modal-backdrop" @click="closeUnenrollModals">
      <div class="modal-card" @click.stop>
        <header class="modal-header">
          <h3 class="modal-title">Request Course Unenrollment</h3>
          <button type="button" class="btn-close-modal" @click="closeUnenrollModals">&times;</button>
        </header>
        <div class="modal-body">
          <p class="modal-desc">
            <strong>{{ targetUnenrollModule?.title }}</strong> is a teacher-assigned curriculum course. Unenrollment requires review and approval from your instructor.
          </p>
          <div class="modal-info-box">
            <span>ℹ While your request is pending, you will retain full access to this course and its materials.</span>
          </div>

          <div class="form-group" style="margin-top: 14px;">
            <label class="form-label" for="unenroll-reason">Reason for Dropping (Optional)</label>
            <textarea 
              id="unenroll-reason"
              v-model="unenrollReason" 
              class="form-textarea" 
              rows="3" 
              placeholder="e.g. Schedule conflict with robotics lab or transferring to another section."
            ></textarea>
          </div>
        </div>
        <footer class="modal-footer">
          <button type="button" class="btn-modal-cancel" @click="closeUnenrollModals" :disabled="isSubmittingUnenroll">
            Cancel
          </button>
          <button 
            type="button" 
            class="btn-modal-primary" 
            :disabled="isSubmittingUnenroll"
            @click="submitCurriculumUnenrollRequest"
            id="btn-submit-curriculum-unenroll"
          >
            <span v-if="isSubmittingUnenroll">Submitting...</span>
            <span v-else>Submit Request</span>
          </button>
        </footer>
      </div>
    </div>

    <!-- All Enrolled & Finished Modal -->
    <Transition name="overlay-fade">
      <div
        v-if="showAllEnrolledModal"
        class="all-enrolled-overlay"
        role="dialog"
        aria-modal="true"
        aria-label="All Enrolled and Finished Modules"
        @click.self="showAllEnrolledModal = false"
      >
        <div class="all-enrolled-modal">
          <div class="all-enrolled-header">
            <div>
              <h2 class="all-enrolled-title">All Enrolled & Finished Modules</h2>
              <p class="all-enrolled-subtitle">View all courses you are currently taking or have completed</p>
            </div>
            <button class="btn-close-modal" type="button" aria-label="Close" @click="showAllEnrolledModal = false">✕</button>
          </div>

          <div class="all-enrolled-tabs">
            <button
              type="button"
              class="all-enrolled-tab"
              :class="{ 'is-active': enrolledFilter === 'all' }"
              @click="enrolledFilter = 'all'"
            >
              All ({{ enrolledList.length }})
            </button>
            <button
              type="button"
              class="all-enrolled-tab"
              :class="{ 'is-active': enrolledFilter === 'in-progress' }"
              @click="enrolledFilter = 'in-progress'"
            >
              In Progress ({{ enrolledList.filter(e => (e.progressPercent || 0) < 100).length }})
            </button>
            <button
              type="button"
              class="all-enrolled-tab"
              :class="{ 'is-active': enrolledFilter === 'finished' }"
              @click="enrolledFilter = 'finished'"
            >
              Finished ({{ enrolledList.filter(e => (e.progressPercent || 0) >= 100).length }})
            </button>
          </div>

          <div v-if="filteredAllEnrolled.length" class="all-enrolled-grid">
            <div
              v-for="enrolled in filteredAllEnrolled"
              :key="enrolled.id"
              class="enrolled-card"
              :class="`card-${enrolled.theme || 'yellow'}`"
              @click="$emit('open-module', enrolled); showAllEnrolledModal = false"
            >
              <div class="card-content-top">
                <div class="card-title-row">
                  <h3 class="enrolled-card-title">{{ enrolled.title }}</h3>
                  <span class="status-pill" :class="(enrolled.progressPercent || 0) >= 100 ? 'status-pill--done' : 'status-pill--prog'">
                    {{ (enrolled.progressPercent || 0) >= 100 ? 'Finished' : 'In Progress' }}
                  </span>
                </div>
                <p class="enrolled-card-subtitle">{{ enrolled.subtitle }}</p>
              </div>
              <div class="enrolled-progress-row">
                <div class="progress-bar-track" :class="{ 'track-translucent': enrolled.theme !== 'yellow' }">
                  <div
                    class="progress-bar-fill"
                    :class="{
                      'fill-blue': enrolled.theme === 'yellow',
                      'fill-lavender': enrolled.theme === 'purple',
                      'fill-pink': enrolled.theme === 'pink'
                    }"
                    :style="{ width: `${enrolled.progressPercent || 0}%` }"
                  ></div>
                </div>
                <span class="progress-ratio">{{ enrolled.currentStep }}/{{ enrolled.totalSteps }}</span>
              </div>
            </div>
          </div>
          <div v-else class="all-enrolled-empty">
            <p>No modules found in this category.</p>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import axios from 'axios';
import { useAuthStore } from '../stores/authStore.js';
import { StudentSyncService } from '../../../lib/student/studentSyncService.ts';
import { supabase } from '../lib/supabaseClient.js';

const emit = defineEmits(['notify', 'open-module']);
const authStore = useAuthStore();

const expandedId = ref(null);
const showOnlyFavorites = ref(false);
const showSearch = ref(false);
const searchQuery = ref('');
const showAllEnrolledModal = ref(false);
const enrolledFilter = ref('all');
const activeCardMenuId = ref(null);
const currentEnrolledPage = ref(0);
const CARDS_PER_PAGE = 4;
const transitionName = ref('slide-left');

function getActiveUserEmail() {
  if (authStore?.currentUser?.email) {
    return authStore.currentUser.email.toLowerCase().trim();
  }
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('sb-') && k.endsWith('-auth-token')) {
        const raw = localStorage.getItem(k);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed?.user?.email) return parsed.user.email.toLowerCase().trim();
        }
      }
    }
    const activeId = localStorage.getItem('risse_active_user_id');
    if (activeId) {
      const rawAccounts = localStorage.getItem('risse_registered_accounts');
      if (rawAccounts) {
        const accounts = JSON.parse(rawAccounts);
        const user = accounts.find(a => a.id === activeId);
        if (user && user.email) return user.email.toLowerCase().trim();
      }
    }
  } catch (e) {}
  return '';
}

const isValidUuid = (val) =>
  typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

const isLoadingModules = ref(false);
const loadError = ref(null);
const enrolledList = ref([]);
const modulesList = ref([]);
const publishedClassModules = ref([]);
const foundationCurriculumModules = ref([]);

const filteredAllEnrolled = computed(() => {
  if (enrolledFilter.value === 'in-progress') {
    return enrolledList.value.filter(e => (e.progressPercent || 0) < 100);
  }
  if (enrolledFilter.value === 'finished') {
    return enrolledList.value.filter(e => (e.progressPercent || 0) >= 100);
  }
  return enrolledList.value;
});

const totalPages = computed(() => Math.ceil(enrolledList.value.length / CARDS_PER_PAGE) || 1);

const displayedEnrolledCards = computed(() => {
  const start = currentEnrolledPage.value * CARDS_PER_PAGE;
  return enrolledList.value.slice(start, start + CARDS_PER_PAGE);
});

function nextCarouselPage() {
  transitionName.value = 'slide-left';
  if (currentEnrolledPage.value < totalPages.value - 1) {
    currentEnrolledPage.value++;
  } else {
    currentEnrolledPage.value = 0;
  }
}

function prevCarouselPage() {
  transitionName.value = 'slide-right';
  if (currentEnrolledPage.value > 0) {
    currentEnrolledPage.value--;
  } else {
    currentEnrolledPage.value = totalPages.value - 1;
  }
}

// Unenroll modals state
const showSelfPacedUnenrollModal = ref(false);
const showCurriculumUnenrollModal = ref(false);
const targetUnenrollModule = ref(null);
const unenrollReason = ref('');
const isSubmittingUnenroll = ref(false);

// Student notifications state
const isStudentNotifsOpen = ref(false);
const studentNotifDropdownRef = ref(null);
const studentNotifications = ref([]);
const unreadStudentNotifsCount = computed(() => (studentNotifications.value || []).filter(n => !n.is_read).length);

function toggleStudentNotifs() {
  isStudentNotifsOpen.value = !isStudentNotifsOpen.value;
}

async function handleStudentNotifClick(notif) {
  if (!notif.is_read) {
    await StudentSyncService.markNotificationRead(notif.id);
    notif.is_read = true;
  }
}

function formatNotifTime(isoStr) {
  if (!isoStr) return '';
  try {
    const d = new Date(isoStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch (_) {
    return isoStr;
  }
}

function toggleCardMenu(id) {
  activeCardMenuId.value = activeCardMenuId.value === id ? null : id;
}

function closeCardMenu() {
  activeCardMenuId.value = null;
}

function closePopovers(e) {
  closeCardMenu();
  if (studentNotifDropdownRef.value && !studentNotifDropdownRef.value.contains(e.target)) {
    isStudentNotifsOpen.value = false;
  }
}

function promptUnenroll(enrolled) {
  activeCardMenuId.value = null;
  targetUnenrollModule.value = enrolled;
  unenrollReason.value = '';
  if (enrolled.enrollmentType === 'self_paced') {
    showSelfPacedUnenrollModal.value = true;
  } else {
    showCurriculumUnenrollModal.value = true;
  }
}

function closeUnenrollModals() {
  showSelfPacedUnenrollModal.value = false;
  showCurriculumUnenrollModal.value = false;
  targetUnenrollModule.value = null;
  unenrollReason.value = '';
}

async function confirmSelfPacedUnenroll() {
  if (!targetUnenrollModule.value) return;
  isSubmittingUnenroll.value = true;
  const mod = targetUnenrollModule.value;
  const studentId = authStore?.currentUser?.id;
  try {
    if (studentId && mod.courseId) {
      await StudentSyncService.unenrollSelfPacedCourse(studentId, mod.courseId);
    }
    enrolledList.value = enrolledList.value.filter(e => e.id !== mod.id);
    if (currentEnrolledPage.value >= totalPages.value) {
      currentEnrolledPage.value = Math.max(0, totalPages.value - 1);
    }
    const modInExplore = modulesList.value.find(m => m.id === mod.id || m.title === mod.title);
    if (modInExplore) {
      modInExplore.actionText = 'Enroll';
      modInExplore.status = 'unregistered';
      // Preserves historical checkpoint progress in student_module_memory
    }
    emit('notify', `Unenrolled from "${mod.title}". Completed checkpoints remain safely saved.`);
    closeUnenrollModals();
  } catch (err) {
    emit('notify', err.message || 'Failed to unenroll.');
  } finally {
    isSubmittingUnenroll.value = false;
  }
}

async function submitCurriculumUnenrollRequest() {
  if (!targetUnenrollModule.value) return;
  isSubmittingUnenroll.value = true;
  const mod = targetUnenrollModule.value;
  const studentId = authStore?.currentUser?.id;
  try {
    const res = await StudentSyncService.requestCurriculumUnenrollment({
      studentId: studentId || '19e54c4f-d062-42b0-8b08-fc88a7afdbb3',
      courseId: mod.courseId || String(mod.id),
      sectionId: mod.sectionId || null,
      mentorId: mod.mentorId || null,
      reason: unenrollReason.value.trim(),
    });
    if (res.success) {
      mod.isPendingUnenrollment = true;
      const targetEnrolled = enrolledList.value.find(e => e.id === mod.id);
      if (targetEnrolled) targetEnrolled.isPendingUnenrollment = true;
      const modInExplore = modulesList.value.find(m => m.id === mod.id || m.title === mod.title);
      if (modInExplore) modInExplore.isPendingUnenrollment = true;
      emit('notify', `Unenrollment request submitted for "${mod.title}". Awaiting instructor review.`);
      closeUnenrollModals();
    } else {
      emit('notify', res.error || 'Failed to submit unenrollment request.');
    }
  } catch (err) {
    emit('notify', err.message || 'Error submitting unenrollment request.');
  } finally {
    isSubmittingUnenroll.value = false;
  }
}

// Backward-compatible alias
const handleUnenroll = promptUnenroll;

const activeCatalogFilter = ref('all'); // 'all' | 'class-courses' | 'foundation'

const displayedModules = computed(() => {
  let list = modulesList.value;

  if (activeCatalogFilter.value === 'class-courses') {
    list = list.filter(m => m.isClassCourse);
  } else if (activeCatalogFilter.value === 'foundation') {
    list = list.filter(m => !m.isClassCourse);
  }

  if (showOnlyFavorites.value) {
    list = list.filter(m => m.isStarred);
  }
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.trim().toLowerCase();
    list = list.filter(m => 
      m.title.toLowerCase().includes(q) ||
      (m.skillsAcquired && m.skillsAcquired.toLowerCase().includes(q)) ||
      (m.level && m.level.toLowerCase().includes(q))
    );
  }
  return list;
});

// Phase 2C & Workflow Repair: Authoritative Database Loader
async function loadModules() {
  isLoadingModules.value = true;
  loadError.value = null;

  // 1. Purge any stale localStorage module keys across sessions
  try {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('risse_') && (key.includes('explore_modules') || key.includes('enrolled_modules')))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));
  } catch (_) {}

  const studentId = authStore?.currentUser?.id;

  try {
    // 2. Load authoritative platform curriculum modules from Supabase public.curriculum_modules
    let dbFoundation = [];
    try {
      let rawModules = [];
      const { data, error } = await supabase
        .from('curriculum_modules')
        .select('*, curriculum_checkpoints(*)')
        .order('id', { ascending: true });

      if (!error && Array.isArray(data)) {
        rawModules = data;
      } else {
        // Fallback: separate queries joined in memory if FK relationship isn't configured in schema cache
        const { data: mods } = await supabase
          .from('curriculum_modules')
          .select('*')
          .order('id', { ascending: true });
        if (Array.isArray(mods) && mods.length > 0) {
          const { data: cps } = await supabase
            .from('curriculum_checkpoints')
            .select('*')
            .order('step_number', { ascending: true });
          rawModules = mods.map(m => ({
            ...m,
            curriculum_checkpoints: (cps || []).filter(c => String(c.module_id) === String(m.id)),
          }));
        }
      }

      if (Array.isArray(rawModules) && rawModules.length > 0) {
        dbFoundation = rawModules.map(m => {
          const cps = (m.curriculum_checkpoints || []).sort((a, b) => (a.step_number || 0) - (b.step_number || 0));
          const totalSteps = m.total_steps || cps.length || 3;
          const skills = Array.isArray(m.skills_acquired) ? m.skills_acquired.join(', ') : (m.skills_acquired || 'Robotics Fundamentals');
          return {
            id: m.id,
            title: m.title,
            level: m.level || 'Beginner',
            levelColor: m.level_color || 'yellow',
            steps: `${totalSteps} Learning Steps`,
            skillsAcquired: skills,
            badge: m.badge_name || 'Curriculum Scholar',
            status: 'unregistered',
            isStarred: false,
            actionText: 'Enroll',
            isClassCourse: false,
            checkpoints: cps.map(c => ({
              id: c.id,
              name: c.title,
              type: c.type || 'concept',
              description: c.description || '',
              estimated_minutes: c.estimated_minutes || 30,
            })),
          };
        });
      }
    } catch (e) {
      console.warn('[ModulesPage] Error loading curriculum_modules:', e);
    }

    foundationCurriculumModules.value = dbFoundation;

    // 3. Load published courses assigned to student's enrolled sections via StudentSyncService
    let dbClassCourses = [];
    if (studentId) {
      try {
        const published = await StudentSyncService.getPublishedModulesForStudent(studentId);
        if (Array.isArray(published)) {
          dbClassCourses = published.map(p => ({
            ...p,
            isClassCourse: true,
          }));
        }
      } catch (err) {
        console.warn('[ModulesPage] Error loading published class courses:', err);
      }
    }
    publishedClassModules.value = dbClassCourses;

    // 4. Combine real database modules
    const combined = [...dbClassCourses, ...dbFoundation];

    // 5. Fetch student progress from Supabase student_module_memory
    const progressMap = new Map();
    if (studentId && isValidUuid(studentId)) {
      try {
        const { data: memData } = await supabase
          .from('student_module_memory')
          .select('*')
          .eq('student_id', studentId);
        if (Array.isArray(memData)) {
          memData.forEach(r => progressMap.set(String(r.module_id), r));
        }
      } catch (_) {}
    }

    // Enrich combined list with live progress
    const enrichedList = combined.map(mod => {
      const prog = progressMap.get(String(mod.id));
      const progressPercent = prog ? Number(prog.progress_percent) || 0 : (mod.progressPercent || 0);
      const isCompleted = prog?.status === 'completed' || progressPercent >= 100;
      const isStarted = progressPercent > 0 || prog?.status === 'in_progress';

      // INVARIANT: For class courses, active enrollment is strictly governed by whether student is currently enrolled
      // Historical progress is preserved in progressPercent/transcripts, but NEVER fabricates active enrollment
      const isActivelyEnrolled = mod.isClassCourse ? Boolean(mod.isStudentEnrolled) : (isStarted || isCompleted);

      let actionText = 'Enroll';
      let status = 'unregistered';

      if (isActivelyEnrolled) {
        if (isCompleted) {
          actionText = 'Review';
          status = 'completed';
        } else if (isStarted) {
          actionText = 'Resume';
          status = 'in_progress';
        } else {
          actionText = 'Start';
          status = 'enrolled';
        }
      } else {
        actionText = 'Enroll';
        status = 'unregistered';
      }

      return {
        ...mod,
        progressPercent,
        actionText,
        status,
        isStudentEnrolled: isActivelyEnrolled,
        currentCheckpoint: prog?.current_checkpoint || mod.currentCheckpoint || 'Foundation',
      };
    });

    modulesList.value = enrichedList;

    // 6. Populate Currently Enrolled strictly from active enrollment
    const enrolledFromDb = enrichedList
      .filter(m => {
        if (m.isClassCourse) {
          return Boolean(m.isStudentEnrolled) && (m.status === 'enrolled' || m.actionText === 'Start' || m.status === 'in_progress' || m.status === 'completed');
        }
        return m.status === 'enrolled' || m.actionText === 'Start' || m.status === 'in_progress' || m.status === 'completed' || (m.progressPercent || 0) > 0;
      })
      .map(edm => {
        const match = (edm.steps || '').match(/\d+/);
        const totalSteps = match ? parseInt(match[0]) : (edm.totalSteps || 3);
        const currentStep = edm.status === 'completed' || edm.progressPercent >= 100
          ? totalSteps
          : Math.min(totalSteps, Math.floor(((edm.progressPercent || 0) / 100) * totalSteps));
        return {
          id: edm.id,
          courseId: edm.courseId,
          title: edm.title,
          subtitle: `${edm.level} • ${edm.currentCheckpoint || 'Foundation'}`,
          theme: edm.levelColor || 'yellow',
          currentStep,
          totalSteps,
          progressPercent: edm.progressPercent || 0,
          badge: edm.badge,
          isStarred: edm.isStarred,
          courseTitle: edm.courseTitle,
          isClassCourse: edm.isClassCourse,
          enrollmentType: edm.enrollmentType || 'curriculum',
          isTeacherAssigned: edm.isTeacherAssigned,
          isPendingUnenrollment: edm.isPendingUnenrollment,
          pendingRequestId: edm.pendingRequestId,
          mentorId: edm.mentorId,
          sectionId: edm.sectionId,
        };
      });

    enrolledList.value = enrolledFromDb;

    // 7. Load persistent notifications for student
    if (studentId) {
      try {
        const notifs = await StudentSyncService.getStudentNotifications(studentId);
        studentNotifications.value = notifs || [];
      } catch (_) {}
    }

  } catch (err) {
    console.error('[ModulesPage] loadModules critical error:', err);
    loadError.value = 'Failed to load curriculum modules from database. Please check your network and retry.';
    modulesList.value = [];
    enrolledList.value = [];
  } finally {
    isLoadingModules.value = false;
  }
}

const loadPublishedModules = loadModules;

// Re-sync when authenticated user changes
watch(() => authStore?.currentUser?.email, () => {
  loadModules();
});

let realtimeChannel = null;

function handleWindowFocus() {
  loadModules();
}

onMounted(async () => {
  window.addEventListener('click', closePopovers);
  window.addEventListener('focus', handleWindowFocus);
  await loadModules();

  // Supabase Realtime subscription for instant module catalog synchronization
  try {
    realtimeChannel = supabase
      .channel('modules-catalog-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'courses' }, () => {
        loadModules();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'course_sections' }, () => {
        loadModules();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'section_students' }, () => {
        loadModules();
      })
      .subscribe();
  } catch (_) {}
});

onUnmounted(() => {
  window.removeEventListener('click', closePopovers);
  window.removeEventListener('focus', handleWindowFocus);
  if (realtimeChannel) {
    try {
      supabase.removeChannel(realtimeChannel);
    } catch (_) {}
    realtimeChannel = null;
  }
});

function toggleExpand(id) {
  expandedId.value = expandedId.value === id ? null : id;
}

async function toggleFavorite(module) {
  module.isStarred = !module.isStarred;
  emit('notify', module.isStarred 
    ? `Added "${module.title}" to favorites!` 
    : `Removed "${module.title}" from favorites.`
  );
  try {
    await axios.post('/api/modules/favorite', { 
      moduleId: module.id, 
      isStarred: module.isStarred 
    });
  } catch (e) {}
}

function toggleFavoritesFilter() {
  showOnlyFavorites.value = !showOnlyFavorites.value;
  emit('notify', showOnlyFavorites.value 
    ? 'Filtered: Showing favorited modules only' 
    : 'Showing all modules'
  );
}

function handleSeeAll() {
  showAllEnrolledModal.value = true;
}

async function handleModuleClick(module) {
  if (module.actionText === 'Enroll') {
    module.actionText = 'Start';
    module.status = 'enrolled';

    const existing = enrolledList.value.find(e => e.id === module.id || e.title === module.title);
    if (!existing) {
      const match = (module.steps || '').match(/\d+/);
      const totalSteps = match ? parseInt(match[0]) : 3;
      
      const newCard = {
        id: module.id,
        courseId: module.courseId,
        title: module.title,
        subtitle: `${module.level} • Not Started`,
        theme: module.levelColor || 'yellow',
        currentStep: 0,
        totalSteps: totalSteps,
        progressPercent: 0,
        currentPath: 'Not Started',
        badge: module.badge,
        isStarred: module.isStarred,
        courseTitle: module.courseTitle,
        isClassCourse: module.isClassCourse,
        enrollmentType: module.enrollmentType || 'self_paced',
        isTeacherAssigned: Boolean(module.isTeacherAssigned),
        isPendingUnenrollment: false,
        mentorId: module.mentorId,
        sectionId: module.sectionId,
      };
      
      enrolledList.value.push(newCard);
    }

    emit('notify', `Enrolled in "${module.title}"! Added to Currently Enrolled.`);

    const studentId = authStore?.currentUser?.id;
    if (studentId) {
      if (module.courseId) {
        StudentSyncService.enrollSelfPacedCourse(studentId, module.courseId)
          .catch(err => console.warn('[ModulesPage] enrollSelfPacedCourse note:', err));
      }
      StudentSyncService.recordCheckpointProgress(
        studentId,
        module.id,
        'Foundation',
        0
      ).catch(err => console.warn('[ModulesPage] Initial enroll sync non-fatal:', err));
    }

    try {
      await axios.post('/api/modules/enroll', { moduleId: module.id });
    } catch (e) {}
  } else {
    const enrolledObj = enrolledList.value.find(e => e.id === module.id || e.title === module.title);
    const payload = enrolledObj || {
      id: module.id,
      courseId: module.courseId,
      title: module.title,
      level: module.level,
      currentStep: 0,
      totalSteps: (module.steps || '').match(/\d+/) ? parseInt(module.steps.match(/\d+/)[0]) : 3,
      progressPercent: 0,
      currentPath: 'Not Started',
      badge: module.badge,
      theme: module.levelColor || 'yellow',
      checkpoints: module.checkpoints,
      learningObjectives: module.learningObjectives,
      enrollmentType: module.enrollmentType,
    };
    emit('open-module', payload);
  }
}
</script>

<style scoped>
.modules-page-wrapper {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  overflow: hidden;
  box-sizing: border-box;
}

/* Header */
.modules-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 36px 32px 20px 40px;
  margin: 0;
  flex-shrink: 0;
}

.modules-title {
  font-family: var(--font-family-display, 'Momo Trust Display', sans-serif);
  font-size: 50px;
  font-weight: 400;
  color: #181d24;
  letter-spacing: -0.5px;
  line-height: 100%;
  margin: 0;
}

.modules-header-actions {
  display: flex;
  align-items: center;
  gap: 14px;
}

.btn-icon-star {
  background: transparent;
  border: none;
  cursor: pointer;
  color: #1f2937;
  padding: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  transition: transform 0.2s, color 0.2s, background-color 0.2s;
}

.btn-icon-star svg {
  width: 28px;
  height: 28px;
}

.btn-icon-star:hover {
  transform: scale(1.12);
  color: #ff7a00;
  background-color: rgba(255, 122, 0, 0.08);
}

.btn-icon-star.is-active-filter {
  color: #ff7a00;
  background-color: rgba(255, 122, 0, 0.12);
}

.btn-see-all {
  background: #ffffff;
  border: 1px solid #d1d5db;
  border-radius: 12px;
  padding: 10px 22px;
  font-size: 16px;
  font-weight: 600;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.btn-see-all:hover {
  background: #f9fafb;
  border-color: #9ca3af;
  color: #111827;
}

/* Enrolled Carousel Outer Wrapper */
.enrolled-carousel-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  margin: 0 32px 18px 40px;
  flex-shrink: 0;
  width: auto;
  border-radius: 20px;
}

/* Viewport that clips sliding cards */
.enrolled-cards-viewport {
  width: 100%;
  overflow: hidden;
  position: relative;
  min-height: 112px;
  display: flex;
}

/* Fixed 4-column structure */
.enrolled-cards-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
  flex: 1;
  min-width: 0;
  width: 100%;
}

/* Slide Left / Right Animation Transitions */
.slide-left-enter-active,
.slide-left-leave-active,
.slide-right-enter-active,
.slide-right-leave-active {
  transition: transform 0.35s cubic-bezier(0.2, 0, 0, 1), opacity 0.35s cubic-bezier(0.2, 0, 0, 1);
  width: 100%;
}

.slide-left-enter-from {
  opacity: 0;
  transform: translateX(45px) scale(0.98);
}

.slide-left-leave-to {
  opacity: 0;
  transform: translateX(-45px) scale(0.98);
}

.slide-right-enter-from {
  opacity: 0;
  transform: translateX(-45px) scale(0.98);
}

.slide-right-leave-to {
  opacity: 0;
  transform: translateX(45px) scale(0.98);
}

/* Empty state for currently enrolled */
.enrolled-empty-container {
  flex: 1;
  width: 100%;
}

.empty-enrolled-box {
  display: flex;
  align-items: center;
  gap: 16px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(254, 243, 199, 0.4));
  border: 1.5px dashed rgba(245, 158, 11, 0.35);
  border-radius: 18px;
  padding: 16px 24px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.02);
}

.empty-enrolled-badge {
  font-size: 26px;
  color: #ff7a00;
  background: rgba(255, 122, 0, 0.12);
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.empty-enrolled-content {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.empty-enrolled-title {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  color: #1f2937;
}

.empty-enrolled-text {
  margin: 0;
  font-size: 13px;
  color: #6b7280;
  line-height: 1.45;
}

.highlight-orange {
  color: #ea580c;
  font-weight: 700;
}

/* Enrolled Card Styling */
.enrolled-card {
  border-radius: 18px;
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 112px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
  position: relative;
  cursor: pointer;
  transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s ease;
  user-select: none;
  min-width: 0;
}

.enrolled-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 22px rgba(0, 0, 0, 0.08);
}

/* Gradient edge overlays */
.carousel-gradient-edge {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 80px;
  border: none;
  display: flex;
  align-items: center;
  cursor: pointer;
  z-index: 25;
  padding: 0 14px;
  opacity: 0.95;
  transition: opacity 0.2s ease;
  user-select: none;
}

.edge-next {
  right: 0;
  justify-content: flex-end;
  border-top-right-radius: 18px;
  border-bottom-right-radius: 18px;
  background: linear-gradient(
    to right,
    rgba(246, 247, 249, 0) 0%,
    rgba(246, 247, 249, 0.5) 30%,
    rgba(246, 247, 249, 0.92) 75%,
    rgba(246, 247, 249, 1) 100%
  );
}

.edge-prev {
  left: 0;
  justify-content: flex-start;
  border-top-left-radius: 18px;
  border-bottom-left-radius: 18px;
  background: linear-gradient(
    to left,
    rgba(246, 247, 249, 0) 0%,
    rgba(246, 247, 249, 0.5) 30%,
    rgba(246, 247, 249, 0.92) 75%,
    rgba(246, 247, 249, 1) 100%
  );
}

.carousel-gradient-edge:hover {
  opacity: 1;
}

.carousel-chevron {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #1f2937;
  filter: drop-shadow(0 1px 3px rgba(255, 255, 255, 0.9));
  transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), color 0.2s ease;
}

.edge-next:hover .carousel-chevron {
  transform: translateX(3px) scale(1.1);
  color: #F18701;
}

.edge-prev:hover .carousel-chevron {
  transform: translateX(-3px) scale(1.1);
  color: #F18701;
}

/* Card Kebab Menu */
.card-kebab-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.btn-card-kebab {
  background: transparent;
  border: none;
  padding: 4px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s ease, background-color 0.2s ease, transform 0.15s ease;
}

.enrolled-card:hover .btn-card-kebab,
.btn-card-kebab.is-menu-open {
  opacity: 0.85;
}

.btn-card-kebab:hover {
  opacity: 1 !important;
  transform: scale(1.1);
  background-color: rgba(255, 255, 255, 0.25);
}

.card-yellow .btn-card-kebab {
  color: #1f2937;
}

.card-purple .btn-card-kebab,
.card-pink .btn-card-kebab {
  color: #ffffff;
}

/* Dropdown popover */
.card-kebab-dropdown {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(0, 0, 0, 0.04);
  padding: 4px;
  z-index: 100;
  min-width: 120px;
}

.dropdown-item-unenroll {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  font-size: 13px;
  font-weight: 600;
  color: #dc2626;
  background: transparent;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.15s ease;
  font-family: inherit;
  text-align: left;
}

.dropdown-item-unenroll:hover {
  background: #fee2e2;
  color: #b91c1c;
}

.dropdown-fade-enter-active,
.dropdown-fade-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.dropdown-fade-enter-from,
.dropdown-fade-leave-to {
  opacity: 0;
  transform: scale(0.95) translateY(-4px);
}

/* Themes */
.card-yellow {
  background: #f5a623;
  color: #1f2937;
}

.card-yellow .enrolled-card-title {
  color: #181d24;
}

.card-yellow .enrolled-card-subtitle {
  color: #ffffff;
}

.card-yellow .progress-ratio {
  color: #6366f1;
}

.card-purple {
  background: linear-gradient(110deg, #241142 0%, #361763 45%, #4f1d8c 80%, #6d28d9 100%);
  color: #ffffff;
}

.card-purple .enrolled-card-title {
  color: #ffffff;
}

.card-purple .enrolled-card-subtitle {
  color: #c7d2fe;
}

.card-purple .progress-ratio {
  color: #c4b5fd;
}

.card-pink {
  background: linear-gradient(110deg, #831843 0%, #9d174d 45%, #be185d 80%, #ec4899 100%);
  color: #ffffff;
}

.card-pink .enrolled-card-title {
  color: #ffffff;
}

.card-pink .enrolled-card-subtitle {
  color: #fce7f3;
}

.card-pink .progress-ratio {
  color: #fce7f3;
}

.card-title-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.enrolled-card-title {
  font-size: 15px;
  font-weight: 800;
  margin: 0 0 3px 0;
  letter-spacing: -0.2px;
  line-height: 1.25;
}

.enrolled-card-subtitle {
  font-size: 11.5px;
  margin: 0 0 12px 0;
  font-weight: 500;
  line-height: 1.3;
}

.enrolled-progress-row {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
}

.progress-bar-track {
  flex: 1;
  height: 6px;
  background: #ffffff;
  border-radius: 9999px;
  overflow: hidden;
}

.track-translucent {
  background: rgba(255, 255, 255, 0.25);
}

.progress-bar-fill {
  height: 100%;
  border-radius: 9999px;
  transition: width 0.3s ease;
}

.fill-blue {
  background: #6366f1;
}

.fill-lavender {
  background: #c4b5fd;
}

.fill-pink {
  background: #f472b6;
}

.progress-ratio {
  font-size: 12px;
  font-weight: 700;
  min-width: 22px;
  text-align: right;
}

/* Explore Header Row */
.explore-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  flex-shrink: 0;
}

.explore-heading-group {
  display: flex;
  align-items: center;
  gap: 12px;
}

.explore-heading {
  font-size: 14.5px;
  font-weight: 800;
  color: #ff7a00;
  margin: 0;
  margin-left: 80px;
}

.filter-indicator-badge {
  font-size: 11px;
  font-weight: 700;
  color: #ff7a00;
  background: rgba(255, 122, 0, 0.12);
  padding: 2px 8px;
  border-radius: 9999px;
}

.explore-toolbar {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-right: 60px;
}

.toolbar-btn {
  background: transparent;
  border: none;
  color: #6b7280;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s, transform 0.2s;
}

.toolbar-btn:hover {
  color: #ff7a00;
  transform: translateY(-1px);
}

/* Catalog Filter Bar */
.catalog-filter-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
}

.filter-pill-btn {
  padding: 5px 12px;
  font-size: 12px;
  font-weight: 600;
  border-radius: 20px;
  background: #f1f5f9;
  color: #475569;
  border: 1px solid #e2e8f0;
  cursor: pointer;
  transition: all 0.15s ease;
}

.filter-pill-btn:hover {
  background: #e2e8f0;
  color: #0f172a;
}

.filter-pill-btn.is-active {
  background: #fff7ed;
  color: #ea580c;
  border-color: #fdba74;
}

.no-assigned-courses-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 24px 20px;
  background: #ffffff;
  border: 1px dashed #cbd5e1;
  border-radius: 12px;
  margin-bottom: 16px;
}

.no-assigned-courses-card .empty-badge {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #fff7ed;
  color: #ea580c;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
}

.no-assigned-courses-card .empty-title {
  font-size: 14px;
  font-weight: 700;
  color: #111827;
  margin: 0 0 3px 0;
}

.no-assigned-courses-card .empty-desc {
  font-size: 12px;
  color: #64748b;
  margin: 0;
  line-height: 1.4;
}

/* Scrollable Explore Container */
.explore-scroll-container {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: 6px;
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 transparent;
}

.explore-scroll-container::-webkit-scrollbar {
  width: 6px;
}

.explore-scroll-container::-webkit-scrollbar-track {
  background: transparent;
}

.explore-scroll-container::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 9999px;
}

.explore-scroll-container::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

.explore-modules-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-bottom: 16px;
}

/* Card Badges and Kebab Dropdown Enhancements */
.card-title-badges-col {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
  flex: 1;
}

.badge-pending-pill {
  align-self: flex-start;
  font-size: 9.5px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 1px 7px;
  background: rgba(254, 243, 199, 0.95);
  color: #92400e;
  border: 1px solid #fde68a;
  border-radius: 9999px;
}

.dropdown-item-disabled {
  width: 100%;
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 600;
  color: #94a3b8;
  background: transparent;
  border: none;
  cursor: not-allowed;
  text-align: left;
}

/* Module Card Item (Part 1 Overlap & Responsive Fix) */
.module-card-item {
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 16px;
  padding: 18px 22px;
  display: flex;
  align-items: center;
  gap: 18px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
  transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
  margin: 0 20px 14px 20px;
  box-sizing: border-box;
  width: calc(100% - 40px);
  min-height: auto;
  position: relative;
  flex-wrap: wrap;
}

.module-card-item:hover {
  border-color: #94a3b8;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.06);
  transform: translateY(-1px);
}

.module-thumbnail-box {
  width: 110px;
  height: 68px;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  border-radius: 10px;
  overflow: hidden;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #e2e8f0;
}

.thumbnail-inner {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.thumb-star-icon {
  font-size: 22px;
  color: #f18701;
  opacity: 0.6;
}

.module-info-col {
  flex: 1 1 260px;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.module-badges-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  margin-bottom: 2px;
}

.badge-type-pill {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 9999px;
  letter-spacing: 0.03em;
  text-transform: uppercase;
}

.pill-assigned {
  background: #f0fdf4;
  color: #166534;
  border: 1px solid #bbf7d0;
}

.pill-self-paced {
  background: #eff6ff;
  color: #1e40af;
  border: 1px solid #bfdbfe;
}

.pill-curriculum {
  background: #f8fafc;
  color: #475569;
  border: 1px solid #cbd5e1;
}

.pill-pending-approval {
  background: #fffbeb;
  color: #b45309;
  border: 1px solid #fde68a;
}

.module-title-text {
  font-size: 17.5px;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
  line-height: 1.35;
  word-break: break-word;
}

.module-course-subtitle {
  font-size: 12px;
  font-weight: 600;
  color: #f18701;
  margin: 0;
}

.module-desc-text {
  font-size: 12px;
  color: #64748b;
  margin: 2px 0 0 0;
  line-height: 1.45;
  word-break: break-word;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.level-pill {
  font-size: 10.5px;
  font-weight: 700;
  color: #ffffff;
  padding: 2px 8px;
  border-radius: 9999px;
  letter-spacing: 0.2px;
}

.pill-yellow { background: #f59e0b; }
.pill-pink { background: #ec4899; }
.pill-purple { background: #4338ca; }

.module-skills-col {
  flex: 1 1 200px;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.acquired-skills-text {
  font-size: 11.5px;
  color: #475569;
  margin: 0;
  line-height: 1.35;
  word-break: break-word;
}

.skills-lead, .badge-lead {
  color: #1e293b;
  font-weight: 600;
}

.badge-target-text {
  font-size: 11.5px;
  color: #64748b;
  margin: 0;
}

.steps-chip {
  align-self: flex-start;
  font-size: 11px;
  font-weight: 600;
  color: #475569;
  background: #f1f5f9;
  padding: 2px 8px;
  border-radius: 6px;
  margin-top: 2px;
}

.module-actions-col {
  flex: 0 0 auto;
  min-width: 140px;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: center;
  gap: 8px;
  margin-left: auto;
}

.module-expand-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  color: #6b7280;
  padding: 4px;
  display: flex;
  align-items: center;
  transition: transform 0.2s, color 0.2s;
}

.module-expand-btn:hover {
  color: #111827;
}

.module-expand-btn.is-expanded {
  transform: rotate(180deg);
  color: #f18701;
}

.actions-bottom-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-enroll-module {
  background: #F18701;
  color: #ffffff;
  border: none;
  border-radius: 9999px;
  padding: 7px 18px;
  font-size: 12.5px;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.15s ease;
  white-space: nowrap;
  flex-shrink: 0;
  min-width: 84px;
  text-align: center;
}

.btn-enroll-module:hover {
  background: #ff8c1a;
  transform: translateY(-1px);
  box-shadow: 0 4px 10px rgba(255, 122, 0, 0.25);
}

.btn-start {
  background: #F18701;
}

.btn-resume {
  background: #0284c7;
}

.btn-resume:hover {
  background: #0369a1;
  box-shadow: 0 4px 10px rgba(2, 132, 199, 0.25);
}

.btn-review {
  background: #10b981;
}

.btn-review:hover {
  background: #059669;
  box-shadow: 0 4px 10px rgba(16, 185, 129, 0.25);
}

/* Expanded Drawer */
.module-drawer-panel {
  flex: 1 1 100%;
  width: 100%;
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px dashed #e2e8f0;
}

.drawer-title {
  font-size: 12.5px;
  font-weight: 700;
  color: #334155;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin: 0 0 10px 0;
}

.drawer-checkpoints-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 10px;
}

.drawer-cp-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 8px 10px;
}

.cp-num-pill {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #f18701;
  color: #ffffff;
  font-size: 11px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.cp-detail-col {
  flex: 1;
  min-width: 0;
}

.cp-name {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: #0f172a;
}

.cp-type-badge {
  display: inline-block;
  font-size: 9.5px;
  font-weight: 700;
  text-transform: uppercase;
  color: #64748b;
  margin-top: 2px;
}

.cp-desc {
  font-size: 11.5px;
  color: #64748b;
  margin: 4px 0 0 0;
  line-height: 1.35;
}

.drawer-no-cp {
  font-size: 12px;
  color: #64748b;
  font-style: italic;
  margin: 0;
}

/* Notifications Header Icon & Popover */
.student-notif-wrapper {
  position: relative;
}

.btn-icon-notif {
  position: relative;
  background: transparent;
  border: 1px solid #d1d5db;
  border-radius: 50%;
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #1f2937;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-icon-notif:hover {
  border-color: #f18701;
  color: #f18701;
  background: #fff7ed;
}

.student-notif-badge {
  position: absolute;
  top: -3px;
  right: -3px;
  background: #ef4444;
  color: #ffffff;
  font-size: 10px;
  font-weight: 800;
  min-width: 17px;
  height: 17px;
  padding: 0 4px;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #ffffff;
}

.student-notif-popover {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 310px;
  max-height: 380px;
  background: #ffffff;
  border-radius: 14px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.12);
  border: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  z-index: 120;
  overflow: hidden;
}

.student-notif-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #f1f5f9;
  background: #f8fafc;
}

.student-notif-header-title {
  font-size: 13px;
  font-weight: 700;
  color: #0f172a;
}

.student-notif-unread-tag {
  font-size: 10.5px;
  font-weight: 700;
  background: #fee2e2;
  color: #ef4444;
  padding: 1px 7px;
  border-radius: 999px;
}

.student-notif-empty {
  padding: 28px 16px;
  text-align: center;
  font-size: 12px;
  color: #94a3b8;
}

.student-notif-list {
  overflow-y: auto;
  max-height: 300px;
}

.student-notif-item {
  display: flex;
  gap: 10px;
  padding: 12px 14px;
  border-bottom: 1px solid #f1f5f9;
  cursor: pointer;
  transition: background 0.15s ease;
}

.student-notif-item:hover {
  background: #f8fafc;
}

.student-notif-item.is-unread {
  background: #fffbf5;
}

.notif-dot-col {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  flex-shrink: 0;
}

.notif-approved-icon {
  color: #10b981;
  font-weight: 800;
}

.notif-rejected-icon {
  color: #ef4444;
  font-weight: 800;
}

.notif-body-col {
  flex: 1;
  min-width: 0;
}

.notif-headline {
  display: block;
  font-size: 12px;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 2px;
}

.notif-text {
  font-size: 11.5px;
  color: #475569;
  margin: 0 0 3px 0;
  line-height: 1.35;
}

.notif-date {
  font-size: 10px;
  color: #94a3b8;
}

/* Modals */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.5);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 16px;
}

.modal-card {
  background: #ffffff;
  border-radius: 14px;
  width: 100%;
  max-width: 480px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e2e8f0;
}

.modal-title {
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}

.btn-close-modal {
  background: none;
  border: none;
  font-size: 20px;
  color: #64748b;
  cursor: pointer;
}

.modal-body {
  padding: 20px;
}

.modal-desc {
  font-size: 13.5px;
  color: #334155;
  line-height: 1.5;
  margin: 0 0 12px 0;
}

.modal-info-box {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 10px 12px;
  font-size: 12px;
  color: #475569;
  line-height: 1.45;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 14px 20px;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
}

.btn-modal-cancel {
  padding: 8px 16px;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #475569;
  cursor: pointer;
}

.btn-modal-danger {
  padding: 8px 16px;
  background: #ef4444;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #ffffff;
  cursor: pointer;
}

.btn-modal-danger:hover:not(:disabled) {
  background: #dc2626;
}

.btn-modal-primary {
  padding: 8px 16px;
  background: #f18701;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #ffffff;
  cursor: pointer;
}

.btn-modal-primary:hover:not(:disabled) {
  background: #ff8c1a;
}

/* Responsive Media Queries */
@media (max-width: 960px) {
  .module-card-item {
    padding: 16px;
    gap: 14px;
    margin: 0 12px 12px 12px;
    width: calc(100% - 24px);
  }

  .module-thumbnail-box {
    width: 90px;
    height: 60px;
  }

  .module-info-col {
    flex: 1 1 calc(100% - 110px);
  }

  .module-skills-col {
    flex: 1 1 100%;
    border-top: 1px solid #f1f5f9;
    padding-top: 8px;
  }

  .module-actions-col {
    flex: 1 1 100%;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    border-top: 1px solid #f1f5f9;
    padding-top: 10px;
    margin-left: 0;
  }

  .actions-bottom-row {
    flex: 1;
    justify-content: flex-end;
  }
}

@media (max-width: 640px) {
  .modules-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  .module-card-item {
    margin: 0 8px 10px 8px;
    width: calc(100% - 16px);
  }
}

.explore-search-wrap {
  display: flex;
  align-items: center;
}

.explore-search-input {
  background: #ffffff;
  border: 1px solid #d1d5db;
  border-radius: 9999px;
  padding: 6px 14px;
  font-size: 13px;
  color: #1f2937;
  outline: none;
  width: 190px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  transition: border-color 0.15s ease, width 0.2s ease;
}

.explore-search-input:focus {
  border-color: #ff7a00;
  width: 220px;
}

.all-enrolled-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(15, 23, 42, 0.55);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.all-enrolled-modal {
  background: #ffffff;
  border-radius: 20px;
  padding: 28px;
  width: min(880px, 92vw);
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.25);
  border: 1px solid #e2e8f0;
}

.all-enrolled-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 20px;
}

.all-enrolled-title {
  font-size: 20px;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 4px 0;
}

.all-enrolled-subtitle {
  font-size: 13px;
  color: #64748b;
  margin: 0;
}

.btn-close-modal {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: #f1f5f9;
  color: #64748b;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  transition: background 0.15s, color 0.15s;
}

.btn-close-modal:hover {
  background: #e2e8f0;
  color: #0f172a;
}

.all-enrolled-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 18px;
  border-bottom: 1px solid #f1f5f9;
  padding-bottom: 10px;
}

.all-enrolled-tab {
  background: transparent;
  border: 1px solid transparent;
  padding: 6px 14px;
  border-radius: 9999px;
  font-size: 12.5px;
  font-weight: 600;
  color: #64748b;
  cursor: pointer;
  transition: all 0.15s ease;
}

.all-enrolled-tab:hover {
  color: #0f172a;
  background: #f8fafc;
}

.all-enrolled-tab.is-active {
  background: #ff7a00;
  color: #ffffff;
  border-color: #ff7a00;
}

.all-enrolled-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
  overflow-y: auto;
  padding-right: 4px;
  max-height: calc(85vh - 170px);
}

.all-enrolled-empty {
  padding: 40px 16px;
  text-align: center;
  color: #94a3b8;
  font-size: 13.5px;
}

.status-pill {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 9999px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-left: auto;
}

.status-pill--done {
  background: #dcfce7;
  color: #15803d;
}

.status-pill--prog {
  background: #fef3c7;
  color: #b45309;
}

.overlay-fade-enter-active,
.overlay-fade-leave-active {
  transition: opacity 0.2s ease;
}

.overlay-fade-enter-from,
.overlay-fade-leave-to {
  opacity: 0;
}
</style>