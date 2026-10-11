/* auth.js — admin-only guard for the planner. */
(async function () {
  const API = await window.FamoAPI;
  const loginBase = (window.APP_CONFIG && window.APP_CONFIG.loginUrl) || '';
  const adminBase = (window.APP_CONFIG && window.APP_CONFIG.adminUrl) || '';

  let user = null;
  try {
    user = await API.getMe();
  } catch (error) {
    user = null;
  }

  if (!user) {
    const returnUrl = `${window.location.pathname}${window.location.search}`;
    window.location.replace(`${loginBase}/?return_url=${encodeURIComponent(returnUrl)}`);
    return;
  }

  if (user.role !== 'admin') {
    window.location.replace(`${adminBase}/`);
    return;
  }

  if (typeof window.__famoStart === 'function') {
    window.__famoStart();
  }
})();
