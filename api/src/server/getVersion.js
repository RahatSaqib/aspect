const AspectCacheSingleton = require('../../aspectCache')

const cache = AspectCacheSingleton.getInstance()

async function getVersion() {
  const cachedVersion = await cache.getVersion()

  return {
    version: cachedVersion,
  }
}

module.exports = { getVersion }
