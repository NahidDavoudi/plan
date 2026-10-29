/* bootstrap.js — load the shared cookie-auth API client as an ES module. */
window.FamoAPI = import(`https://assets.famoacademy.ir/js/api.js`).then((m) => m.default);
