/* bootstrap.js — load the shared cookie-auth API client as an ES module. */
window.FamoAPI = import(`${window.APP_CONFIG.assetUrl}/js/api.js`).then((m) => m.default);
