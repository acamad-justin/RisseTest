import { watch, onBeforeUnmount } from 'vue'

/**
 * useDismissable — close a floating menu when the user clicks away or presses Escape.
 *
 * Listeners are registered only while `openRef` is truthy and are always removed
 * when the owning component unmounts. Because Vue flushes watchers on a microtask,
 * the click that *opened* the menu has already finished bubbling by the time the
 * listener is attached, so it never immediately re-closes the menu.
 *
 * @param {import('vue').Ref<boolean>} openRef — whether the menu is open
 * @param {(event: Event) => void} onDismiss  — called to close the menu
 */
export function useDismissable(openRef, onDismiss) {
  function handleOutsideClick(event) {
    if (!openRef.value) return
    onDismiss(event)
  }

  function handleKeydown(event) {
    if (event.key !== 'Escape' || !openRef.value) return
    onDismiss(event)
  }

  watch(openRef, (open) => {
    if (open) {
      document.addEventListener('click', handleOutsideClick)
      document.addEventListener('keydown', handleKeydown)
    } else {
      document.removeEventListener('click', handleOutsideClick)
      document.removeEventListener('keydown', handleKeydown)
    }
  })

  onBeforeUnmount(() => {
    document.removeEventListener('click', handleOutsideClick)
    document.removeEventListener('keydown', handleKeydown)
  })
}
