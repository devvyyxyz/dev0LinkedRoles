const nconf = require("nconf");

nconf
  .env() // ✅ Load from environment (.env / Glitch secrets)
  .argv()
  .file({ file: "./config.json" }); // Optional config.json fallback

module.exports = nconf;
