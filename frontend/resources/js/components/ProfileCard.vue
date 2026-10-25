<template>
  <div class="profile-card" id="profile-card">
    <!-- Avatar square with rounded corners matching screenshot -->
    <div 
      class="profile-avatar-box" 
      @click="$emit('edit')" 
      title="Click to edit avatar"
      role="button"
      tabindex="0"
      aria-label="Profile Avatar"
    >
      <img v-if="user.avatar" :src="user.avatar" :alt="user.name" />
      <!-- If no image, exact neutral grey placeholder matching screenshot -->
      <div v-else class="avatar-placeholder-box"></div>
    </div>

    <!-- Student details -->
    <div class="profile-details">
      <h2 class="profile-name" id="profile-user-name">{{ user.name }}</h2>
      <p class="profile-school" id="profile-user-school">{{ user.school }}</p>
      <p class="profile-grade" id="profile-user-grade">{{ user.grade }}</p>
    </div>

    <!-- Edit pencil icon button -->
    <button 
      type="button" 
      class="profile-edit-btn" 
      @click="$emit('edit')" 
      id="btn-edit-profile"
      title="Edit Profile"
      aria-label="Edit Profile"
    >
      <svg class="risse-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
        <path d="m15 5 4 4"/>
      </svg>
    </button>
  </div>
</template>

<script setup>
defineProps({
  user: {
    type: Object,
    required: true,
    default: () => ({
      name: 'ADRIEL JUSTIN DELA CRUZ',
      school: 'Rizal Polytechnic de Muntinlupa',
      grade: 'Grade 10',
      avatar: null,
    }),
  },
});

defineEmits(['edit']);
</script>

<style scoped>
.avatar-placeholder-box {
  width: 100%;
  height: 100%;
  background-color: #cbd2d9;
  border-radius: inherit;
}
</style>
