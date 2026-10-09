const NodeCache = require("node-cache");

// stdTTL = 60 seconds as required by Practical 9
const cache = new NodeCache({
  stdTTL: 60,
  checkperiod: 120
});

module.exports = cache;
