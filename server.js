const express = require("express");
const { join } = require("path");
const jwt = require("express-jwt");
const jwksRsa = require("jwks-rsa");
const authConfig = require("./auth_config.json");

const app = express();

// Validate Json Web Token
const checkJwt = jwt({
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `https://${authConfig.domain}/.well-known/jwks.json`,
  }),

  audience: authConfig.audience,
  issuer: `https://${authConfig.domain}/`,
  algorithm: ["RS256"],
});

// Serve static assets from the /public folder
app.use("/public", express.static(join(__dirname, "public")));

// Serve the index page for all other requests
app.get("/", (_, res) => {
  res.sendFile(join(__dirname, "index.html"));
});

// Endpoint to serve the configuration file
app.get("/auth_config.json", (req, res) => {
  res.sendFile(join(__dirname, "auth_config.json"));
});

// API only authenticated users can call
// Note: 第二引数の checkJwt が先に実行される
app.get("/api/external", checkJwt, (req, res) => {
  res.send({ msg: "Yeah! Your access token was successfully validated!" });
});

// Handle error
// Note: エラーが発生しうる Routing より後に書かないといけない？
app.use((err, req, res, next) => {
  if (err.name === "UnauthorizedError") {
    return res.status(401).send({ msg: "Invalid token‍" });
  }
  next(err, req, res);
});

// Listen on port 3000
app.listen(3000, () => console.log("Application running on port 3000"));
