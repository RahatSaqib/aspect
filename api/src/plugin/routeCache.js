const NodeCache = require('node-cache')
const _ = require('lodash')
// stdTTL is the default time-to-live for each cache entry
const stdTTL = 60 * 60 * 6 // 6 hours
const routesCacheKey = 'allRoutes'
const routestMatchCacheKey = 'matchingRoutes'
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

  // filter versioned routes which are supporting requested endpoints
  async getAvailableRoutes(routesList, request) {
    const availableRoutes = []
    routesList.map(url => {
      if (url.replace(/v\d+[\\/]/gi, '').trim() === request.path) {
        const parseVersionNumber = url.match(/\d+/)
        const versionNumber = parseVersionNumber && parseInt(parseVersionNumber[0], 10)
        if (versionNumber) {
          availableRoutes.push(versionNumber)
        }
      }
      return url
    })
    return { [request.path]: availableRoutes }
  }

  // return matched routes value
  async getCachedAvailableRoutes(routesList, request) {
    // checking if the routes exists to cached list of routes
    const cachedRoutes = this.routesCache.get(routestMatchCacheKey)
    if (!_.isEmpty(cachedRoutes) && cachedRoutes[request.path]) {
      return cachedRoutes
    }

    // if not found matching routes in cache then set those routes to cache
    const routesVersions = await this.getAvailableRoutes(routesList, request)
    if (_.isEmpty(routesVersions)) {
      this.setCacheValue(routestMatchCacheKey, routesVersions)
    } else {
      this.setCacheValue(routestMatchCacheKey, { ...routesVersions, ...this.routesCache.get(routestMatchCacheKey) })
    }

    return this.routesCache.get(routestMatchCacheKey)
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
