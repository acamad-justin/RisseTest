import _ from 'lodash';
window._ = _;

/**
 * We'll load the axios HTTP library which allows us to easily issue requests
 * to our Laravel back-end. This library automatically handles sending the
 * CSRF token as a header based on the value of the "XSRF" token cookie.
 */

import axios from 'axios';
window.axios = axios;

window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

window.axios.interceptors.request.use((config) => {
  try {
    // 1. Supabase Auth Session
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('sb-') && key.endsWith('-auth-token')) {
        const raw = localStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed?.user?.email) {
            config.headers['X-User-Email'] = parsed.user.email.toLowerCase().trim();
          }
          if (parsed?.access_token) {
            config.headers['Authorization'] = `Bearer ${parsed.access_token}`;
          }
          return config;
        }
      }
    }

    // 2. Legacy fallback if applicable
    const activeId = localStorage.getItem('risse_active_user_id');
    const rawAcc = localStorage.getItem('risse_registered_accounts');
    if (activeId && rawAcc) {
      const accs = JSON.parse(rawAcc);
      const user = accs.find(a => a.id === activeId);
      if (user && user.email) {
        config.headers['X-User-Email'] = user.email.toLowerCase().trim();
      }
    }
  } catch (_) {}
  return config;
});
