<script setup>
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { Menu, X } from '@lucide/vue'

const isMobileMenuOpen = ref(false)

const navLinks = [
  { name: 'Home',  to: '/' },
  { name: 'About', to: '/about' },
]

function toggleMobileMenu() {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}

function closeMobileMenu() {
  isMobileMenuOpen.value = false
}
</script>

<template>
  <header class="header" role="banner">
    <div class="container header__inner">
      <!-- Logo / Brand -->
      <RouterLink to="/" class="header__brand" @click="closeMobileMenu">
        <span class="header__brand-name">RISSE</span>
      </RouterLink>

      <!-- Desktop Navigation -->
      <nav class="header__nav" aria-label="Main navigation">
        <RouterLink
          v-for="link in navLinks"
          :key="link.to"
          :to="link.to"
          class="header__nav-link"
          :aria-current="$route.path === link.to ? 'page' : undefined"
        >
          {{ link.name }}
        </RouterLink>
      </nav>

      <!-- Mobile menu toggle -->
      <button
        class="header__mobile-toggle"
        :aria-expanded="isMobileMenuOpen"
        aria-controls="mobile-menu"
        aria-label="Toggle navigation menu"
        @click="toggleMobileMenu"
      >
        <X v-if="isMobileMenuOpen" :size="22" aria-hidden="true" />
        <Menu v-else :size="22" aria-hidden="true" />
      </button>
    </div>

    <!-- Mobile Navigation Drawer -->
    <Transition name="slide-down">
      <nav
        v-if="isMobileMenuOpen"
        id="mobile-menu"
        class="header__mobile-nav"
        aria-label="Mobile navigation"
      >
        <RouterLink
          v-for="link in navLinks"
          :key="link.to"
          :to="link.to"
          class="header__mobile-link"
          @click="closeMobileMenu"
        >
          {{ link.name }}
        </RouterLink>
      </nav>
    </Transition>
  </header>
</template>

<style scoped>
.header {
  position: sticky;
  top: 0;
  z-index: var(--z-sticky);
  height: var(--header-height);
  background-color: var(--color-background);
  border-bottom: 1px solid var(--color-border);
  box-shadow: var(--shadow-sm);
}

.header__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
}

/* Brand */
.header__brand {
  text-decoration: none;
}

.header__brand-name {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-primary-600);
  letter-spacing: -0.02em;
}

/* Desktop nav */
.header__nav {
  display: none;
  align-items: center;
  gap: var(--space-1);
}

@media (min-width: 768px) {
  .header__nav { display: flex; }
}

.header__nav-link {
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
  transition: background-color var(--transition-fast), color var(--transition-fast);
  text-decoration: none;
}

.header__nav-link:hover,
.header__nav-link.router-link-active {
  background-color: var(--color-primary-50);
  color: var(--color-primary-700);
}

/* Mobile toggle */
.header__mobile-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-2);
  border-radius: var(--radius-md);
  color: var(--color-text-secondary);
  transition: background-color var(--transition-fast);
}

.header__mobile-toggle:hover {
  background-color: var(--color-secondary-100);
}

@media (min-width: 768px) {
  .header__mobile-toggle { display: none; }
}

/* Mobile nav drawer */
.header__mobile-nav {
  position: absolute;
  top: var(--header-height);
  left: 0;
  right: 0;
  z-index: var(--z-dropdown);
  display: flex;
  flex-direction: column;
  padding: var(--space-3);
  background-color: var(--color-background);
  border-bottom: 1px solid var(--color-border);
  box-shadow: var(--shadow-md);
}

.header__mobile-link {
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-md);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
  text-decoration: none;
  transition: background-color var(--transition-fast), color var(--transition-fast);
}

.header__mobile-link:hover,
.header__mobile-link.router-link-active {
  background-color: var(--color-primary-50);
  color: var(--color-primary-700);
}

/* Slide transition */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: transform var(--transition-base), opacity var(--transition-base);
}
.slide-down-enter-from,
.slide-down-leave-to {
  transform: translateY(-8px);
  opacity: 0;
}
</style>
