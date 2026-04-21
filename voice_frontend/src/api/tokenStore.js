/**
 * In-memory access token store.
 * Keeps the access token out of localStorage (XSS-safe).
 * Shared between AuthContext and the Axios interceptor.
 */
let _token = null;

export const tokenStore = {
  get:   ()      => _token,
  set:   (t)     => { _token = t; },
  clear: ()      => { _token = null; },
};
