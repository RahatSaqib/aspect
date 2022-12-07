const NodeCache = require('node-cache')
/**
 * General purpose cache
 */
class AspectCache {
  constructor(ttl = 0) {
    this.cache = new NodeCache({ stdTTL: ttl })
  }

  async setValue(key, value) {
    this.cache.set(key, value)
  }

  async getValue(key) {
    return this.cache.get(key)
  }
}

class AspectCacheSingleton {
  static getInstance() {
    if (!AspectCacheSingleton.instance) {
      AspectCacheSingleton.instance = new AspectCache()
    }
    return AspectCacheSingleton.instance
  }
}

module.exports = AspectCacheSingleton
