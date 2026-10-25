<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content" role="dialog" aria-modal="true" aria-labelledby="edit-profile-title">
      <div class="modal-header">
        <h3 class="modal-title" id="edit-profile-title">Edit Profile</h3>
        <button type="button" class="modal-close-btn" @click="$emit('close')" aria-label="Close modal">&times;</button>
      </div>

      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label class="form-label" for="edit-name">Full Name</label>
          <input 
            id="edit-name" 
            v-model="formData.name" 
            type="text" 
            class="form-input" 
            required 
          />
        </div>

        <div class="form-group">
          <label class="form-label" for="edit-school">School / Institution</label>
          <input 
            id="edit-school" 
            v-model="formData.school" 
            type="text" 
            class="form-input" 
            required 
          />
        </div>

        <div class="form-group">
          <label class="form-label" for="edit-grade">Grade Level</label>
          <input 
            id="edit-grade" 
            v-model="formData.grade" 
            type="text" 
            class="form-input" 
            required 
          />
        </div>

        <div class="form-group">
          <label class="form-label" for="edit-avatar">Avatar Image URL (Optional)</label>
          <input 
            id="edit-avatar" 
            v-model="formData.avatar" 
            type="url" 
            placeholder="Leave empty for default neutral placeholder" 
            class="form-input" 
          />
        </div>

        <div class="modal-actions">
          <button type="button" class="btn-secondary" @click="$emit('close')">Cancel</button>
          <button type="submit" class="btn-primary" id="btn-save-profile">Save Changes</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { reactive } from 'vue';

const props = defineProps({
  user: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(['close', 'save']);

const formData = reactive({
  name: props.user.name,
  school: props.user.school,
  grade: props.user.grade,
  avatar: props.user.avatar || '',
});

function handleSubmit() {
  emit('save', { ...formData });
}
</script>
