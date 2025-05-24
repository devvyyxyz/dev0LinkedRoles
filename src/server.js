const config = require("./config");

console.log("DISCORD_CLIENT_ID:", config.get("DISCORD_CLIENT_ID"));
console.log("DISCORD_CLIENT_SECRET:", config.get("DISCORD_CLIENT_SECRET"));
console.log("DISCORD_REDIRECT_URI:", config.get("DISCORD_REDIRECT_URI"));

const express = require("express");
const session = require("express-session");
const passport = require("passport");
const Strategy = require("passport-discord").Strategy;
const fetch = require("node-fetch");
const axios = require("axios");
const storage = require("./storage");

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

passport.use(
  new Strategy(
    {
      clientID: config.get("DISCORD_CLIENT_ID"),
      clientSecret: config.get("DISCORD_CLIENT_SECRET"),
      callbackURL: config.get("DISCORD_REDIRECT_URI"),
      scope: ["identify", "guilds", "email", "role_connections.write"]
    },
    (accessToken, refreshToken, profile, done) => {
      profile.accessToken = accessToken;
      process.nextTick(() => done(null, profile));
    }
  )
);

const app = express();

app.use(session({ secret: "linkedrole", resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

app.get("/", (req, res) => {
  res.send(`
    <h1>Welcome to the Linked Roles Bot</h1>
    <p><a href="/login">Log in with Discord</a> to begin.</p>
  `);
});

app.get("/login", passport.authenticate("discord"));

app.get("/callback", passport.authenticate("discord", { failureRedirect: "/" }), async (req, res) => {
  try {
    const userResponse = await fetch("https://discord.com/api/v10/users/@me", {
      headers: {
        Authorization: `Bearer ${req.user.accessToken}`
      }
    });

    const user = await userResponse.json();
    const flags = user.public_flags || 0;
    const isHypeSquad = (flags & (1 << 6)) || (flags & (1 << 7)) || (flags & (1 << 8)) ? 1 : 0;

    const metadata = {
      is_hypesquad: isHypeSquad
    };

    // Send the metadata to Discord
    await axios.put(
      `https://discord.com/api/v10/users/@me/applications/${config.get("DISCORD_CLIENT_ID")}/role-connection`,
      {
        platform_name: "Linked Role Bot",
        metadata
      },
      {
        headers: {
          Authorization: `Bearer ${req.user.accessToken}`,
          "Content-Type": "application/json"
        }
      }
    );

    res.redirect("/success");
  } catch (error) {
    console.error("Failed to send metadata to Discord:", error);
    res.status(500).send("Error sending metadata to Discord.");
  }
});

app.get("/success", (req, res) => {
  res.send(`
    <h1>✅ Linked Role Setup Complete</h1>
    <p>Your account has been linked successfully. You may now close this window.</p>
    <p><a href="/api/discord-user">View your metadata</a></p>
  `);
});

app.get("/logout", (req, res) => {
  req.logout(() => res.redirect("/"));
});

app.get("/api/discord-user", async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Not logged in" });

  const userResponse = await fetch("https://discord.com/api/v10/users/@me", {
    headers: {
      Authorization: `Bearer ${req.user.accessToken}`
    }
  });
  const user = await userResponse.json();

  const flags = user.public_flags || 0;
  const isHypeSquad = (flags & (1 << 6)) || (flags & (1 << 7)) || (flags & (1 << 8)) ? 1 : 0;

  const metadata = [
    {
      key: "is_hypesquad",
      value: isHypeSquad
    }
  ];

  res.json({ metadata });
});

app.listen(6060, () => console.log("Server running on port 6060"));
