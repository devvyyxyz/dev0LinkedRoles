require("dotenv").config();

const nconf = require("nconf");

nconf
  .env()                // ✅ Loads from .env file
  .argv()
  .file({ file: "./config.json" }); // Optional

module.exports = nconf;
