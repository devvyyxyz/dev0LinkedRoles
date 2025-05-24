const express = require("express");
const session = require("express-session");
const passport = require("passport");
const Strategy = require("passport-discord").Strategy;
const fetch = require("node-fetch");
const storage = require("./storage");
const config = require("./config");

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

passport.use(
  new Strategy(
    {
      clientID: config.DISCORD_CLIENT_ID,
      clientSecret: config.DISCORD_CLIENT_SECRET,
      callbackURL: config.DISCORD_REDIRECT_URI,
      scope: ["identify", "guilds", "email"]
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

app.get("/login", passport.authenticate("discord"));
app.get("/callback", passport.authenticate("discord", { failureRedirect: "/" }), (req, res) =>
  res.redirect("/success")
);

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
  const isHypeSquad =
    (flags & (1 << 6)) || (flags & (1 << 7)) || (flags & (1 << 8)) ? 1 : 0;

  const metadata = [
    {
      key: "is_hypesquad",
      value: isHypeSquad
    }
  ];

  res.json({ metadata });
});

app.listen(3000, () => console.log("Server running on port 3000"));
