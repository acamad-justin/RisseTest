<template>
  <section class="featured-projects-section" aria-labelledby="featured-projects-heading">
    <h3 class="section-heading-orange" id="featured-projects-heading">Featured Projects</h3>

    <div v-if="projects && projects.length" class="projects-container">
      <article 
        v-for="(project, index) in projects" 
        :key="project.id" 
        class="project-card"
        :id="`project-card-${project.id}`"
      >
        <!-- Thumbnail / Image Area -->
        <div class="project-thumbnail-area">
          <img v-if="project.thumbnail" :src="project.thumbnail" :alt="project.title" class="project-thumbnail-img" />
          <div v-else class="project-thumbnail-placeholder"></div>

          <!-- 3-Dots Action Button -->
          <div class="project-menu-wrapper">
            <button 
              type="button" 
              class="project-menu-btn" 
              @click.stop="toggleMenu(project.id)"
              :id="`project-menu-btn-${project.id}`"
              title="More project actions"
              aria-label="More project actions"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="5" r="2"/>
                <circle cx="12" cy="12" r="2"/>
                <circle cx="12" cy="19" r="2"/>
              </svg>
            </button>

            <!-- Dropdown Menu -->
            <div v-if="activeMenuId === project.id" class="project-dropdown-menu">
              <button type="button" @click.stop="onAction('view', project)" class="dropdown-item">View Details</button>
              <button type="button" @click.stop="onAction('share', project)" class="dropdown-item">Share Project</button>
              <button type="button" @click.stop="onAction('edit', project)" class="dropdown-item">Edit Info</button>
            </div>
          </div>
        </div>

        <!-- Project Details -->
        <div class="project-body">
          <h4 class="project-title">{{ project.title }}</h4>
          <p class="project-tags">
            {{ formatTags(project.tags) }}
          </p>
        </div>
      </article>
    </div>
    <div v-else class="empty-projects-notice">
      <span>No featured projects yet. Projects you build and submit in robotics modules will be showcased here.</span>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

const props = defineProps({
  projects: {
    type: Array,
    required: true,
    default: () => [],
  },
});

const emit = defineEmits(['project-action']);
const activeMenuId = ref(null);

function toggleMenu(id) {
  activeMenuId.value = activeMenuId.value === id ? null : id;
}

function onAction(action, project) {
  activeMenuId.value = null;
  emit('project-action', { action, project });
}

function formatTags(tags) {
  if (Array.isArray(tags)) {
    return tags.join(' ');
  }
  return tags;
}

function handleOutsideClick(e) {
  if (!e.target.closest('.project-menu-wrapper')) {
    activeMenuId.value = null;
  }
}

onMounted(() => {
  window.addEventListener('click', handleOutsideClick);
});

onUnmounted(() => {
  window.removeEventListener('click', handleOutsideClick);
});
</script>

<style scoped>
.project-thumbnail-placeholder {
  width: 100%;
  height: 100%;
  background-color: #d8dde3;
  border-radius: inherit;
}

.project-menu-wrapper {
  position: absolute;
  top: 14px;
  right: 14px;
}

.project-dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 6px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
  min-width: 150px;
  padding: 6px;
  z-index: 30;
  animation: fadeIn 0.15s ease-out;
}

.dropdown-item {
  display: block;
  width: 100%;
  padding: 8px 12px;
  text-align: left;
  background: transparent;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  color: #374151;
  cursor: pointer;
  transition: background-color 0.15s, color 0.15s;
  font-family: inherit;
}

.dropdown-item:hover {
  background-color: #f3f4f6;
  color: #ff7a00;
}

.empty-projects-notice {
  font-size: 13.5px;
  color: #94a3b8;
  padding: 16px 20px;
  background: #f8fafc;
  border: 1px dashed #e2e8f0;
  border-radius: 16px;
  text-align: center;
  font-style: italic;
  line-height: 1.5;
}
</style>
