const express = require("express");
const redis = require("redis");

const PORT = process.env.PORT || 5000;
const REDIS_PORT = process.env.PORT || 6379;

const client = redis.createClient(REDIS_PORT);
const app = express();

// Set response
function setResponse(username, repos) {
  return `<h2>${username} has ${repos} Github repos</h2>`;
}

// Make request to Github for data
async function getRepos(req, res, next) {
  try {
    console.log("Fetching Data...");

    const { username } = req.params;

    const response = await fetch(`https://api.github.com/users/${username}`);
    const data = await response.json();

    const repos = data.public_repos;

    // Set data to Redis
    client.setEx(username, 3600, JSON.stringify(repos));

    res.send(setResponse(username, repos));
    client.quit();
  } catch (err) {
    console.error(err);
    res.status(500);
  }
}

// Cache middleware
async function cache(req, res, next) {
  const { username } = req.params;
  await client.connect();
  console.log("I am here")
  const data = await client.get(username)
  if (data !== null) {
    res.send(setResponse(username, data));
    client.quit();
  } else {
    next();
  }
}

app.get("/repos/:username", cache, getRepos);

app.listen(5000, () => {
  console.log(`App listening on port ${PORT}`);
});
