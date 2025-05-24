const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v10");
const config = require("./config");

const rest = new REST({ version: "10" }).setToken(config.get("DISCORD_TOKEN"));

async function registerMetadata() {
  const metadata = [
    {
      key: "is_hypesquad",
      name: "Is HypeSquad Member",
      description: "User must be a HypeSquad badge holder.",
      type: 4 // Boolean = true
    },
    {
      key: "account_age_days",
      name: "Account Age (Days)",
      description: "User account must be at least X days old.",
      type: 1 // Integer ≥
    },
    {
      key: "has_nitro",
      name: "Has Nitro",
      description: "User must have an active Nitro subscription.",
      type: 4 // Boolean = true
    },
    {
      key: "email_verified",
      name: "Email Verified",
      description: "User must have a verified email address.",
      type: 4 // Boolean = true
    },
    {
      key: "public_flags",
      name: "Badge Flags",
      description: "User must have any public Discord badge.",
      type: 1 // Integer ≥ (we'll assume value ≥ 1 means has a badge)
    }
  ];

  try {
    await rest.put(
      Routes.applicationRoleConnectionMetadata(config.get("DISCORD_CLIENT_ID")),
      { body: metadata }
    );
    console.log("✅ Successfully registered application role connection metadata.");
  } catch (error) {
    console.error("❌ Failed to register metadata:", error);
  }
}

registerMetadata();
