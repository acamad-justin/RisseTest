<template>
  <div 
    class="risse-layout" 
    :class="{ 
      'risse-layout--home': currentTab === 'Home' || currentTab === 'DynamicHome'
    }"
  >
    <!-- Full astronomical star field background active on standard Home view -->
    <CosmicBackground v-if="currentTab === 'Home'" />

    <!-- Left Navigation Bar (Orange Pill) -->
    <Sidebar 
      :active-tab="currentTab === 'DynamicHome' ? 'Home' : currentTab" 
      @update:active-tab="handleTabChange"
      @update:activeTab="handleTabChange"
      @open-settings="handleOpenSettings"
    />

    <!-- Main Content Area -->
    <main class="risse-main" role="main">
      <!-- DYNAMIC HOME VIEW (Real-time Canvas Space, Parallax, Meteors, Star Chart) -->
      <DynamicHomeView v-if="currentTab === 'DynamicHome'" />

      <!-- STANDARD HOME VIEW (Constellation & Space) -->
      <HomeView 
        v-else-if="currentTab === 'Home'" 
        :is-chat-open="isChatOpen"
        @open-module="currentTab = 'Modules'"
        @open-mascot-prompt="openChat"
      />

      <!-- NOTEBOOKS VIEW (Logs & Projects & Conversation Workspace) -->
      <NotebooksView 
        v-else-if="currentTab === 'Notebooks'"
        :initial-view="notebooksViewMode"
        :initial-log-id="targetLogId"
        :user-name="userFirstName"
        @view-changed="notebooksViewMode = $event"
      />

      <!-- MODULES VIEWS FLOW -->
      <template v-else-if="currentTab === 'Modules'">
        <!-- View 3: Checkpoint Lesson & AI Chatbot -->
        <CheckpointContentView 
          v-if="moduleViewState === 'checkpoint'"
          :checkpoint-title="selectedCheckpoint"
          :parent-module-name="selectedModule.title"
          :module-data="selectedModule"
          @back="moduleViewState = 'roadmap'"
          @notify="showToast"
          @complete-checkpoint="handleCheckpointCompleted"
        />

        <!-- View 2: Module Progression Chart / Roadmap Checkpoints -->
        <ModuleRoadmapView 
          v-else-if="moduleViewState === 'roadmap'"
          :module-data="selectedModule"
          @back="moduleViewState = 'list'"
          @select-checkpoint="handleSelectCheckpoint"
          @award-badge="handleAwardBadge"
          @notify="showToast"
          @update-module="handleUpdateModule"
        />

        <!-- View 1: Main Modules Page (Currently Enrolled & Scrollable Explore) -->
        <ModulesPage 
          v-else
          @open-module="handleOpenModule"
          @notify="showToast"
        />
      </template>

      <!-- PROFILE PAGE VIEW -->
      <div v-else-if="currentTab === 'Profile'" class="profile-page-content">
        <h1 class="risse-page-title" id="page-title">Profile</h1>

        <!-- Top Row: Profile Card (Left) & Stats (Right) perfectly aligned -->
        <div class="risse-top-row">
          <div class="top-profile-col">
            <ProfileCard 
              :user="profileData.user" 
              @edit="isEditModalOpen = true"
            />
          </div>

          <div class="top-stats-col">
            <StatsSection 
              :stats="profileData.stats" 
            />
          </div>
        </div>

        <!-- Bottom Grid: Skills & Achievements (Left) & Featured Projects (Right) -->
        <div class="risse-bottom-grid">
          <!-- Left Column: Demonstrated Skills & Achievements -->
          <div class="bottom-left-col">
            <SkillsSection 
              :skills="profileData.skills" 
            />

            <AchievementsSection 
              :achievements="profileData.achievements"
              @select-badge="handleSelectBadge"
            />
          </div>

          <!-- Right Column: Featured Projects extending to right edge -->
          <div class="bottom-right-col">
            <FeaturedProjects 
              :projects="profileData.featuredProjects"
              @project-action="handleProjectAction"
            />
          </div>
        </div>
      </div>

    </main>

    <!-- Seamless Full-Screen Edge-to-Edge Circular Reveal Overlay (Safely guarded against accidental white screen) -->
    <div 
      v-show="isOverlayVisible"
      class="home-prompt-overlay"
      :class="{ 
        'is-open': isChatOpen,
        'is-transferring': isTransferringPrompt 
      }"
    >
      <div 
        class="chat-reveal-inner"
        :class="{ 'is-open': isChatOpen }"
      >
        <NotebookPromptView
          :user-name="userFirstName"
          :projects="notebooksStore.projects"
          :can-close="!isTransferringPrompt"
          :is-submitting="isTransferringPrompt"
          @close="closeChat"
          @back="closeChat"
          @submit="handleHomePromptSubmit"
        />
      </div>
    </div>

    <!-- Edit Profile Modal -->
    <EditProfileModal 
      v-if="isEditModalOpen" 
      :user="profileData.user"
      @close="isEditModalOpen = false"
      @save="handleSaveProfile"
    />

    <!-- Badge Detail Modal -->
    <BadgeModal 
      v-if="selectedBadge" 
      :badge="selectedBadge"
      @close="selectedBadge = null"
    />

    <!-- Toast Notification -->
    <div v-if="toastMessage" class="risse-toast">
      {{ toastMessage }}
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue';
import axios from 'axios';
import Sidebar from './components/Sidebar.vue';
import CosmicBackground from './components/layout/CosmicBackground.vue';
import HomeView from './views/HomeView.vue';
import DynamicHomeView from './views/DynamicHomeView.vue';
import NotebooksView from './views/NotebooksView.vue';
import NotebookPromptView from './components/notebooks/NotebookPromptView.vue';
import { useNotebooksStore } from './stores/notebooksStore.js';
import ModulesPage from './components/ModulesPage.vue';
import ModuleRoadmapView from './components/ModuleRoadmapView.vue';
import CheckpointContentView from './components/CheckpointContentView.vue';
import ProfileCard from './components/ProfileCard.vue';
import StatsSection from './components/StatsSection.vue';
import SkillsSection from './components/SkillsSection.vue';
import AchievementsSection from './components/AchievementsSection.vue';
import FeaturedProjects from './components/FeaturedProjects.vue';
import EditProfileModal from './components/EditProfileModal.vue';
import BadgeModal from './components/BadgeModal.vue';

const notebooksStore = useNotebooksStore();

// ── URL-Driven Initial Tab Detection ──────────────────────────────────────
function getInitialTabFromUrl() {
  const path = window.location.pathname.toLowerCase();
  const search = window.location.search.toLowerCase();
  if (path.includes('dynamic') || search.includes('dynamic')) {
    return 'DynamicHome';
  }
  if (path.includes('home') || search.includes('home')) {
    return 'Home';
  }
  if (path.includes('notebook') || search.includes('notebook')) {
    return 'Notebooks';
  }
  if (path.includes('profile') || search.includes('profile')) {
    return 'Profile';
  }
  return 'Home';
}

// Navigation & View States
const currentTab = ref(getInitialTabFromUrl());
const notebooksViewMode = ref('overview'); // 'overview' | 'prompt' | 'workspace'
const targetLogId = ref(null);

// Circular Reveal Overlay States
const isChatOpen = ref(false);
const isOverlayVisible = ref(false);
const isTransferringPrompt = ref(false);
const moduleViewState = ref('list'); // 'list' | 'roadmap' | 'checkpoint'

function openChat() {
  isOverlayVisible.value = true;
  requestAnimationFrame(() => {
    isChatOpen.value = true;
  });
  isTransferringPrompt.value = false;
}

function closeChat() {
  isChatOpen.value = false;
  setTimeout(() => {
    if (!isChatOpen.value) {
      isOverlayVisible.value = false;
    }
  }, 650);
}

function handleHomePromptSubmit({ text, attachment, projectId }) {
  if (isTransferringPrompt.value) return;
  isTransferringPrompt.value = true;

  // 1. Create the new log in store
  const title = text ? (text.length > 36 ? text.slice(0, 36) + '…' : text) : 'New Log';
  const log = notebooksStore.createLog({ title, projectId });

  const now = new Date().toISOString();
  let userContent = text;
  if (attachment?.content) {
    userContent = `[Attached File: ${attachment.name}]\n\`\`\`\n${attachment.content.slice(0, 10000)}\n\`\`\`\n\n${text || 'Please inspect the attached file and help me understand or improve it.'}`;
  } else if (attachment) {
    userContent = `[Attached File: ${attachment.name} (${attachment.size})]\n\n${text || 'Please review this file.'}`;
  }

  const userMessage = {
    id: `id-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    role: 'user',
    content: userContent,
    displayContent: text || `[Attached File: ${attachment?.name}]`,
    attachment,
    createdAt: now,
  };

  log.messages.push(userMessage);
  log.updatedAt = now;
  log.preview = (text || attachment?.name || '').slice(0, 120);
  notebooksStore.persist?.();

  targetLogId.value = log.id;
  notebooksViewMode.value = 'workspace';

  // 2. Redirect to notebooks page (updates sidebar pill & history) while overlay stays covering
  currentTab.value = 'Notebooks';
  window.history.pushState({}, '', '/notebooks');

  // 3. Keep the prompt view covering calmly, then smoothly transition overlay out to reveal the chatbox
  setTimeout(() => {
    isChatOpen.value = false;
    setTimeout(() => {
      isTransferringPrompt.value = false;
    }, 550);
  }, 400);
}

function openNotebookPrompt() {
  notebooksViewMode.value = 'prompt';
  currentTab.value = 'Notebooks';
  window.history.pushState({}, '', '/notebooks');
}

const selectedModule = ref({
  id: 1,
  title: 'Robotics Fundamentals',
  level: 'Beginner',
  currentPath: 'Inputs, Output, and Signals',
});

const selectedCheckpoint = ref('Inputs, Output, and Signals');

const isEditModalOpen = ref(false);
const selectedBadge = ref(null);
const toastMessage = ref('');

// ── Dynamic Document Title Management ─────────────────────────────────────
function updateDocumentTitle() {
  let title = 'Risse';
  if (currentTab.value === 'DynamicHome') {
    title = 'Dynamic Star Chart | Risse';
  } else if (currentTab.value === 'Home') {
    title = 'Your Space | Risse';
  } else if (currentTab.value === 'Notebooks') {
    title = 'Notebooks | Risse';
  } else if (currentTab.value === 'Modules') {
    if (moduleViewState.value === 'checkpoint' && selectedCheckpoint.value) {
      title = `${selectedCheckpoint.value} | Risse`;
    } else if (moduleViewState.value === 'roadmap' && selectedModule.value?.title) {
      title = `${selectedModule.value.title} | Risse`;
    } else {
      title = 'Modules | Risse';
    }
  } else if (currentTab.value === 'Profile') {
    title = 'Profile | Risse';
  }
  document.title = title;
}

watch(
  [currentTab, moduleViewState, selectedCheckpoint, selectedModule],
  () => {
    updateDocumentTitle();
  },
  { immediate: true }
);

function ensureFavicon() {
  let link = document.querySelector("link[rel~='icon']");
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }
  link.type = 'image/png';
  link.href = '/favicon.png';
}

function getInitialProfile() {
  try {
    const raw = localStorage.getItem('risse_profile_data');
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return null;
}

const savedProfile = getInitialProfile();

// Clean default profile state with zero mock data (restores from localStorage if available)
const profileData = reactive(savedProfile || {
  user: {
    name: 'ADRIEL JUSTIN DELA CRUZ',
    school: 'Rizal Polytechnic de Muntinlupa',
    grade: 'Grade 10',
    avatar: null,
  },
  stats: {
    projects: 0,
    mastered: 0,
    badges: 0,
  },
  skills: [],
  achievements: [],
  featuredProjects: [],
});

const userFirstName = computed(() => {
  const full = profileData.user?.name || 'Adriel';
  const first = full.trim().split(/\s+/)[0] || 'Adriel';
  return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
});

watch(profileData, (val) => {
  try {
    localStorage.setItem('risse_profile_data', JSON.stringify(val));
  } catch (e) {}
}, { deep: true });

// Fetch live profile from Laravel API & listen for popstate
onMounted(async () => {
  ensureFavicon();
  window.addEventListener('popstate', () => {
    isChatOpen.value = false;
    isOverlayVisible.value = false;
    currentTab.value = getInitialTabFromUrl();
  });

  try {
    const res = await axios.get('/api/profile');
    if (res.data) {
      if (res.data.user) Object.assign(profileData.user, res.data.user);
      if (res.data.stats) Object.assign(profileData.stats, res.data.stats);
      if (res.data.skills) profileData.skills = res.data.skills;
      if (res.data.achievements) profileData.achievements = res.data.achievements;
      if (res.data.featuredProjects) profileData.featuredProjects = res.data.featuredProjects;
    }
  } catch (err) {
    console.log('Profile loaded locally');
  }
});

async function handleAwardBadge(payload, maybeSkills = []) {
  let badge = null;
  let skills = [];

  if (payload && payload.badge) {
    badge = payload.badge;
    skills = payload.skills || maybeSkills || [];
  } else if (payload && payload.title) {
    badge = payload;
    skills = maybeSkills || [];
  } else if (typeof payload === 'string') {
    badge = { title: payload, category: 'Module Mastery', description: 'Awarded for module completion.' };
    skills = maybeSkills || [];
  }

  if (!badge) return;

  if (!badge.id) {
    badge.id = badge.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  }

  const exists = profileData.achievements.find(a => a.title === badge.title);
  if (!exists) {
    profileData.achievements.push(badge);
    profileData.stats.badges = profileData.achievements.length;
    profileData.stats.mastered = (profileData.stats.mastered || 0) + 1;
  }

  if (Array.isArray(skills)) {
    skills.forEach(s => {
      if (s && !profileData.skills.includes(s)) {
        profileData.skills.push(s);
      }
    });
  }

  // Open modal celebration immediately
  selectedBadge.value = badge;
  showToast(`🏆 Achievement Unlocked: ${badge.title}!`);

  try {
    const res = await axios.post('/api/profile/award-badge', { badge, skills });
    if (res.data && res.data.data) {
      if (res.data.data.stats) Object.assign(profileData.stats, res.data.data.stats);
      if (res.data.data.achievements) profileData.achievements = res.data.data.achievements;
      if (res.data.data.skills) profileData.skills = res.data.data.skills;
    }
  } catch (e) {
    console.log('Badge saved locally');
  }
}

function handleUpdateModule(updatedMod) {
  selectedModule.value = { ...selectedModule.value, ...updatedMod };
}

function handleCheckpointCompleted({ checkpoint, nextCheckpoint, isLast }) {
  const currentStep = (selectedModule.value.currentStep || 0) + 1;
  const totalSteps = selectedModule.value.totalSteps || 3;
  const progressPercent = Math.min(100, Math.round((currentStep / totalSteps) * 100));

  selectedModule.value = {
    ...selectedModule.value,
    currentStep,
    progressPercent,
  };

  if (isLast) {
    showToast(`🏆 Mastered ${selectedModule.value.title}!`);
    moduleViewState.value = 'roadmap';
    const badgeTitle = selectedModule.value.badge && selectedModule.value.badge !== 'No Badge'
      ? selectedModule.value.badge
      : 'Speed Learner';

    const badge = {
      id: selectedModule.value.id || Date.now(),
      title: badgeTitle,
      category: selectedModule.value.title || 'Robotics & Control Systems',
      description: `Mastered all learning checkpoints in ${selectedModule.value.title} with 100% star chart constellation calibration.`,
      badgeImage: null,
      rarity: 'Legendary',
      unlockedAt: 'Just Now',
    };

    let skills = [];
    if (selectedModule.value.skillsAcquired) {
      skills = selectedModule.value.skillsAcquired.split(',').map(s => s.trim()).filter(Boolean);
    }
    if (!skills.length) {
      skills = ['Rapid Prototyping', 'Checkpoint Progression', 'Star Chart Navigation'];
    }

    handleAwardBadge(badge, skills);
  } else if (nextCheckpoint) {
    selectedCheckpoint.value = nextCheckpoint;
    showToast(`Checkpoint "${checkpoint}" completed!`);
  }
}

function handleTabChange(tab) {
  isChatOpen.value = false;
  isOverlayVisible.value = false;
  currentTab.value = tab;
  if (tab === 'Notebooks') {
    notebooksViewMode.value = 'overview';
  }
  if (tab === 'Modules' && moduleViewState.value === 'checkpoint') {
    moduleViewState.value = 'list';
  }
  // Sync URL in history cleanly
  if (tab === 'DynamicHome') {
    window.history.pushState({}, '', '/dynamic-home');
  } else if (tab === 'Home') {
    window.history.pushState({}, '', '/');
  } else if (tab === 'Notebooks') {
    window.history.pushState({}, '', '/notebooks');
  } else if (tab === 'Modules') {
    window.history.pushState({}, '', '/modules');
  } else if (tab === 'Profile') {
    window.history.pushState({}, '', '/profile');
  }
}

function handleOpenModule(module) {
  selectedModule.value = module;
  moduleViewState.value = 'roadmap';
}

function handleSelectCheckpoint(checkpointName) {
  selectedCheckpoint.value = checkpointName;
  moduleViewState.value = 'checkpoint';
}

function handleSelectBadge(badge) {
  selectedBadge.value = badge;
}

function handleOpenSettings() {
  showToast('Settings panel opened');
}

function handleProjectAction({ action, project }) {
  showToast(`${action.toUpperCase()} action on "${project.title}"`);
}

async function handleSaveProfile(updatedUser) {
  Object.assign(profileData.user, updatedUser);
  isEditModalOpen.value = false;
  showToast('Profile updated successfully!');

  try {
    await axios.post('/api/profile/update', updatedUser);
  } catch (err) {
    console.log('Saved to state');
  }
}

function showToast(msg) {
  toastMessage.value = msg;
  setTimeout(() => {
    toastMessage.value = '';
  }, 3000);
}
</script>

<style scoped>
.risse-layout--home {
  background: transparent !important;
}

.risse-layout--home .risse-main {
  position: relative;
  z-index: 1;
}

.profile-page-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
}

.risse-toast {
  position: fixed;
  bottom: 24px;
  right: 24px;
  background: #1e293b;
  color: #ffffff;
  padding: 12px 20px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.2);
  z-index: 200;
  animation: slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes slideUp {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

/* ─── Circular Reveal Overlay Transition (Safely Guarded, Zero Flicker) ─── */
.home-prompt-overlay {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  margin: 0;
  border-radius: 0;
  background: #ffffff;
  z-index: 40; /* Sits beneath persistent sidebar (z-index: 100) */
  padding-left: 260px; /* Offset for floating sidebar so workspace content is centered */
  overflow: hidden;
  box-shadow: none;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  will-change: clip-path;
  opacity: 0;
  pointer-events: none;

  /* Closed State (Default): circle(0px at bottom-right mascot), pointer-events: none */
  clip-path: circle(0px at calc(100% - 48px) calc(100% - 48px));
  -webkit-clip-path: circle(0px at calc(100% - 48px) calc(100% - 48px));
  transition: clip-path 0.55s cubic-bezier(0.4, 0, 0.2, 1) 0.15s,
              -webkit-clip-path 0.55s cubic-bezier(0.4, 0, 0.2, 1) 0.15s,
              opacity 0.25s ease;
}

/* Open State: circle(150% at bottom-right mascot), pointer-events: auto */
.home-prompt-overlay.is-open {
  opacity: 1;
  pointer-events: auto;
  clip-path: circle(150% at calc(100% - 48px) calc(100% - 48px));
  -webkit-clip-path: circle(150% at calc(100% - 48px) calc(100% - 48px));
  transition: clip-path 0.6s cubic-bezier(0.22, 1, 0.36, 1) 0s,
              -webkit-clip-path 0.6s cubic-bezier(0.22, 1, 0.36, 1) 0s,
              opacity 0.2s ease;
}

/* Inner Chat UI Wrapper */
.home-prompt-overlay .chat-reveal-inner {
  display: flex;
  flex-direction: column;
  flex: 1;
  width: 100%;
  height: 100%;
  min-height: 0;
  will-change: opacity, transform;

  /* Closed State (Default): fades out immediately over 0.2s */
  opacity: 0;
  transform: translateY(8px);
  transition: opacity 0.2s ease-in 0s, transform 0.2s ease-in 0s;
}

/* Open State: waits 0.35s for white circle expansion before fading in smoothly */
.home-prompt-overlay .chat-reveal-inner.is-open {
  opacity: 1;
  transform: translateY(0px);
  transition: opacity 0.35s ease-out 0.35s, transform 0.35s ease-out 0.35s;
}

/* Transfer to Notebooks on Submit */
.home-prompt-overlay.is-transferring {
  opacity: 0;
  transition: opacity 0.4s ease-out 0s;
  pointer-events: none;
}
</style>
