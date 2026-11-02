<template>
  <div class="modules-page-wrapper">
    <!-- Header: Title & Action Controls -->
    <header class="modules-header">
      <h1 class="modules-title">Currently Enrolled</h1>
      
      <div class="modules-header-actions">
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
              Browse the catalog below and click <strong>Enroll</strong> on the 
              <span class="highlight-orange">Test Module</span> to test instant progress from 0%, dynamic star chart illumination, and achievement unlocks!
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
                  <h3 class="enrolled-card-title">{{ enrolled.title }}</h3>
                  
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
                          type="button" 
                          class="dropdown-item-unenroll" 
                          @click.stop="handleUnenroll(enrolled)"
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
            autofocus
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

    <!-- THE ONLY SCROLLABLE AREA: Explore Modules List -->
    <div class="explore-scroll-container" id="explore-scroll-area">
      <div class="explore-modules-list">
        <article 
          v-for="module in displayedModules" 
          :key="module.id" 
          class="module-card-item"
          :id="`module-item-${module.id}`"
        >
          <div class="module-thumbnail-box">
            <div class="thumbnail-inner"></div>
          </div>

          <div class="module-info-col">
            <h4 class="module-title-text">{{ module.title }}</h4>
            <div class="module-meta-row">
              <span class="level-pill" :class="`pill-${module.levelColor}`">{{ module.level }}</span>
              <span class="steps-text">{{ module.steps }}</span>
            </div>
          </div>

          <div class="module-skills-col">
            <p class="acquired-skills-text">Skills Acquired: {{ module.skillsAcquired }}</p>
            <p class="badge-target-text">Badge: {{ module.badge }}</p>
          </div>

          <div class="module-actions-col">
            <button 
              type="button" 
              class="module-expand-btn" 
              @click="toggleExpand(module.id)"
              title="Expand Details"
              aria-label="Expand Details"
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
                :class="{ 'btn-start': module.actionText === 'Start' }"
                @click="handleModuleClick(module)"
                :id="`btn-enroll-${module.id}`"
              >
                {{ module.actionText }}
              </button>
            </div>
          </div>
        </article>

        <div v-if="displayedModules.length === 0" class="no-modules-placeholder">
          <p>No favorited or matching modules found.</p>
          <button type="button" class="btn-clear-filter" @click="showOnlyFavorites = false; searchQuery = ''">Show All Modules</button>
        </div>
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

function getEnrolledStorageKey(email = getActiveUserEmail()) {
  const safe = email ? email.toLowerCase().trim().replace(/[^a-z0-9]/g, '_') : '';
  return safe ? `risse_email_${safe}_enrolled_modules` : 'risse_enrolled_modules';
}

function getInitialEnrolled() {
  const email = getActiveUserEmail();
  if (!email) return [];
  try {
    const userKey = getEnrolledStorageKey(email);
    let raw = localStorage.getItem(userKey);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return [];
}

const enrolledList = ref(getInitialEnrolled());

watch(enrolledList, (val) => {
  const email = getActiveUserEmail();
  if (!email) return;
  try {
    localStorage.setItem(getEnrolledStorageKey(email), JSON.stringify(val));
  } catch (e) {}
}, { deep: true });

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

function toggleCardMenu(id) {
  activeCardMenuId.value = activeCardMenuId.value === id ? null : id;
}

function closeCardMenu() {
  activeCardMenuId.value = null;
}

async function handleUnenroll(enrolled) {
  const targetId = enrolled.id;
  const targetTitle = enrolled.title;
  activeCardMenuId.value = null;

  enrolledList.value = enrolledList.value.filter(e => e.id !== targetId);

  if (currentEnrolledPage.value >= totalPages.value) {
    currentEnrolledPage.value = Math.max(0, totalPages.value - 1);
  }

  const modInExplore = modulesList.value.find(m => m.id === targetId || m.title === targetTitle);
  if (modInExplore) {
    modInExplore.actionText = 'Enroll';
    modInExplore.status = 'unregistered';
  }

  emit('notify', `Unenrolled from "${targetTitle}".`);

  try {
    await axios.post('/api/modules/unenroll', { moduleId: targetId });
  } catch (e) {}
}

const BASE_EXPLORE_MODULES = [
  {
    id: 999,
    title: 'Test Module: Quick Progression',
    level: 'Beginner',
    levelColor: 'yellow',
    steps: '3 Learning Steps',
    skillsAcquired: 'Rapid Prototyping, Checkpoint Progression, Star Chart Navigation',
    badge: 'Speed Learner',
    status: 'unregistered',
    isStarred: false,
    actionText: 'Enroll',
    description: 'Fast-track test module to test enrolling, advancing checkpoints from 0, dynamic star chart states, and achievement unlocks.',
  },
  {
    id: 101,
    title: 'Sensors & Perception',
    level: 'Beginner',
    levelColor: 'yellow',
    steps: '3 Learning Steps',
    skillsAcquired: 'Component Identification, Circuit Assembly, Electrical Signals',
    badge: 'Sensor Scout',
    status: 'unregistered',
    isStarred: false,
    actionText: 'Enroll',
  },
  {
    id: 102,
    title: 'Programming Robot Behavior',
    level: 'Intermediate',
    levelColor: 'pink',
    steps: '5 Learning Steps',
    skillsAcquired: 'Programming Logic, Conditional Behavior, Sensor-Driven Motion',
    badge: 'Behavior Programmer',
    status: 'unregistered',
    isStarred: false,
    actionText: 'Enroll',
  },
  {
    id: 103,
    title: 'Robotics Fundamentals',
    level: 'Beginner',
    levelColor: 'yellow',
    steps: '4 Learning Steps',
    skillsAcquired: 'Circuit Fundamentals, Motor Control, Power Management',
    badge: 'Motion Builder',
    status: 'unregistered',
    isStarred: false,
    actionText: 'Enroll',
  },
  {
    id: 104,
    title: 'Sumobot Design & Competition',
    level: 'Advanced',
    levelColor: 'purple',
    steps: '6 Learning Steps',
    skillsAcquired: 'Mechanical Design, Strategic Programming, Performance Tuning',
    badge: 'Sumo Champion',
    status: 'unregistered',
    isStarred: false,
    actionText: 'Enroll',
  },
  {
    id: 105,
    title: 'Embedded Microcontroller Architecture',
    level: 'Intermediate',
    levelColor: 'pink',
    steps: '4 Learning Steps',
    skillsAcquired: 'Hardware Registers, SPI/I2C Communication, Clock Timers',
    badge: 'System Architect',
    status: 'unregistered',
    isStarred: false,
    actionText: 'Enroll',
  },
  {
    id: 106,
    title: 'Real-Time Motion Trajectory Planning',
    level: 'Advanced',
    levelColor: 'purple',
    steps: '5 Learning Steps',
    skillsAcquired: 'Kinematics Modeling, PID Vector Loops, Actuator Sync',
    badge: 'Motion Master',
    status: 'unregistered',
    isStarred: false,
    actionText: 'Enroll',
  },
];

function getExploreStorageKey(email = getActiveUserEmail()) {
  const safe = email ? email.toLowerCase().trim().replace(/[^a-z0-9]/g, '_') : '';
  return safe ? `risse_email_${safe}_explore_modules` : 'risse_explore_modules';
}

function getInitialExplore() {
  const email = getActiveUserEmail();
  if (!email) return JSON.parse(JSON.stringify(BASE_EXPLORE_MODULES));
  try {
    const raw = localStorage.getItem(getExploreStorageKey(email));
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}
  return JSON.parse(JSON.stringify(BASE_EXPLORE_MODULES));
}

const modulesList = ref(getInitialExplore());

watch(modulesList, (val) => {
  const email = getActiveUserEmail();
  if (!email) return;
  try {
    localStorage.setItem(getExploreStorageKey(email), JSON.stringify(val));
  } catch (e) {}
}, { deep: true });

const displayedModules = computed(() => {
  let list = modulesList.value;
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

// Re-sync when authenticated user changes
watch(() => authStore?.currentUser?.email, () => {
  enrolledList.value = getInitialEnrolled();
  modulesList.value = getInitialExplore();
});

onMounted(async () => {
  window.addEventListener('click', closeCardMenu);
  try {
    const email = getActiveUserEmail();
    const res = await axios.get('/api/modules', {
      headers: email ? { 'X-User-Email': email } : {}
    });
    if (res.data && Array.isArray(res.data.enrolled)) {
      const userKey = getEnrolledStorageKey(email);
      const hasLocal = email && localStorage.getItem(userKey);
      if (!hasLocal) {
        enrolledList.value = res.data.enrolled;
      }
    }
  } catch (e) {
    // Graceful offline fallback
  }
});

onUnmounted(() => {
  window.removeEventListener('click', closeCardMenu);
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
    const existing = enrolledList.value.find(e => e.id === module.id || e.title === module.title);
    if (!existing) {
      const match = (module.steps || '').match(/\d+/);
      const totalSteps = match ? parseInt(match[0]) : 3;
      
      const newCard = {
        id: module.id,
        title: module.title,
        subtitle: `${module.level} • Not Started`,
        theme: module.levelColor || 'yellow',
        currentStep: 0,
        totalSteps: totalSteps,
        progressPercent: 0,
        currentPath: 'Not Started',
        badge: module.badge,
      };
      
      enrolledList.value.push(newCard);
    }

    emit('notify', `Enrolled in "${module.title}" at 0% progress! Added to Currently Enrolled.`);

    try {
      await axios.post('/api/modules/enroll', { moduleId: module.id });
    } catch (e) {}
  } else {
    const enrolledObj = enrolledList.value.find(e => e.id === module.id || e.title === module.title);
    const payload = enrolledObj || {
      id: module.id,
      title: module.title,
      level: module.level,
      currentStep: 0,
      totalSteps: (module.steps || '').match(/\d+/) ? parseInt(module.steps.match(/\d+/)[0]) : 3,
      progressPercent: 0,
      currentPath: 'Not Started',
      badge: module.badge,
      theme: module.levelColor || 'yellow',
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
  margin: 0 36px 14px 30px;
  flex-shrink: 0;
}

.modules-title {
  font-family: var(--font-family-display, 'Momo Trust Display', sans-serif);
  font-size: 50px;
  font-weight: 400;
  color: #181d24;
  letter-spacing: -0.5px;
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
  margin: 0 36px 18px 30px;
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

/* Module Card Item */
.module-card-item {
  background: #ffffff;
  border: 1px solid #A2A2A2;
  border-radius: 16px;
  padding: 20px 24px;
  display: grid;
  grid-template-columns: 150px 1.2fr 1.6fr auto;
  align-items: center;
  gap: 22px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
  transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
  margin: 0 30px 16px 30px;
}

.module-card-item:hover {
  border-color: #cbd5e1;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.05);
  transform: translateY(-1px);
}

.module-thumbnail-box {
  width: 130px;
  height: 68px;
  background-color: #d8dde3;
  border-radius: 10px;
  overflow: hidden;
  flex-shrink: 0;
}

.thumbnail-inner {
  width: 100%;
  height: 100%;
  background: #d4d8de;
}

.module-info-col {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.module-title-text {
  font-size: 25px;
  font-weight: 400;
  color: #181d24;
  margin: 0;
  letter-spacing: -0.2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.module-meta-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.level-pill {
  font-size: 10.5px;
  font-weight: 700;
  color: #ffffff;
  padding: 2px 8px;
  border-radius: 9999px;
  letter-spacing: 0.2px;
}

.pill-yellow {
  background: #f59e0b;
}

.pill-pink {
  background: #ec4899;
}

.pill-purple {
  background: #4338ca;
}

.steps-text {
  font-size: 11.5px;
  font-weight: 500;
  color: #374151;
}

.module-skills-col {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.acquired-skills-text {
  font-size: 11.5px;
  color: #6b7280;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.badge-target-text {
  font-size: 11.5px;
  color: #6b7280;
  margin: 0;
}

.module-actions-col {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: space-between;
  gap: 8px;
  min-width: 110px;
}

.module-expand-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  color: #6b7280;
  padding: 2px;
  display: flex;
  align-items: center;
  transition: transform 0.2s, color 0.2s;
}

.module-expand-btn:hover {
  color: #111827;
  transform: translateY(1px);
}

.actions-bottom-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.btn-favorite-toggle {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #cbd5e1;
  opacity: 0.25;
  transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease, color 0.2s ease;
}

.module-card-item:hover .btn-favorite-toggle {
  opacity: 0.65;
  color: #9ca3af;
}

.btn-favorite-toggle:hover {
  opacity: 1 !important;
  color: #ff7a00 !important;
  transform: scale(1.22);
}

.btn-favorite-toggle.is-favorited {
  opacity: 1 !important;
  color: #ff7a00 !important;
}

.btn-favorite-toggle.is-favorited:hover {
  transform: scale(1.25);
}

.btn-enroll-module {
  background: #F18701;
  color: #ffffff;
  border: none;
  border-radius: 9999px;
  padding: 5px 18px;
  font-size: 12.5px;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
  transition: background-color 0.2s, transform 0.15s, box-shadow 0.2s;
}

.btn-enroll-module:hover {
  background: #ff8c1a;
  transform: translateY(-1px);
  box-shadow: 0 4px 10px rgba(255, 122, 0, 0.25);
}

.btn-start {
  background: #F18701;
}

.no-modules-placeholder {
  text-align: center;
  padding: 36px 20px;
  background: #ffffff;
  border-radius: 16px;
  border: 1px dashed #d1d5db;
  color: #6b7280;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.btn-clear-filter {
  background: #ff7a00;
  color: #ffffff;
  border: none;
  padding: 6px 16px;
  border-radius: 9999px;
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-clear-filter:hover {
  background: #ff8c1a;
}

@media (max-width: 1024px) {
  .module-card-item {
    grid-template-columns: 100px 1fr;
    gap: 12px;
  }
  .module-skills-col {
    display: none;
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