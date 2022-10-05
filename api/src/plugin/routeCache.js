const NodeCache = require('node-cache')
// stdTTL is the default time-to-live for each cache entry
const stdTTL = 60 * 60 * 6 // 6 hours
const routesCacheKey = 'allRoutes'
class RouteCache {
  constructor(table, ttl = stdTTL) {
    this.marker = Math.random()
    this.table = table
    this.routesCache = new NodeCache({ stdTTL: ttl })
  }

  // set the cache key and value
  async setCacheValue(key, value) {
    this.routesCache.set(key, value)
  }

  // return the cache value
  async getCacheValueRoute() {
    return this.getCacheValue(routesCacheKey)
  }

  async getCacheValue(routesCacheKey) {
    let routes = this.routesCache.get(routesCacheKey)
    if (!(routes?.length > 0)) {
      routes = this.table.map(url => {
        return url.path
      })
      this.setCacheValue(routesCacheKey, routes)
    }
    return routes
  }
}

// singleton pattern for cache  to avoid multiple instances
// singleton pattern class
class RouteCacheSingleton {
  static getInstance(table) {
    if (!RouteCacheSingleton.instance) {
      RouteCacheSingleton.instance = new RouteCache(table)
    }
    return RouteCacheSingleton.instance
  }
}

module.exports = RouteCacheSingleton
