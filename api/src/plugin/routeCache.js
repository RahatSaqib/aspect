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
  async getAvailableRoutes(routesList, requestedPath) {
    const availableRoutes = []
    routesList.map(url => {
      if (url.replace(/v\d+[\\/]/gi, '').trim() === requestedPath) {
        const parseVersionNumber = url.match(/\d+/)
        const versionNumber = parseVersionNumber && parseInt(parseVersionNumber[0], 10)
        if (versionNumber) {
          availableRoutes.push(versionNumber)
        }
      } else {
        const matchingPath = routesList.find(path => path.toLowerCase() === requestedPath.toLowerCase())
        if (matchingPath) {
          return matchingPath
        }

        // check segment length if its matching or not
        const requestedPathSegments = requestedPath.split('/').filter(segment => segment !== '')
        const potentialMatchingConfiguredPaths = routesList.filter(path => {
          return {
            path,
            segments: path
              .replace(/v\d+[\\/]/gi, '')
              .trim()
              .split('/')
              .map(segment => ({
                name: segment,
                mustMatch: !paramRegex.test(segment),
              }))
              .filter(segment => !!segment),
          }
        })

        // checking path parameter match or not
        const paramRegex = /\{\w+\}/gi
        const potentialMatchingConfiguredPathWithSegments = potentialMatchingConfiguredPaths.map(path => {
          return {
            path,
            segments: path
              .replace(/v\d+[\\/]/gi, '')
              .trim()
              .split('/')
              .map(segment => ({
                name: segment,
                mustMatch: !paramRegex.test(segment),
              }))
              .filter(segment => !!segment),
          }
        })
        for (let i = 0; i < potentialMatchingConfiguredPathWithSegments.length; i++) {
          if (
            potentialMatchingConfiguredPathWithSegments[i].segments.every(
              (segment, ii) =>
                !segment.mustMatch || segment.name.toLowerCase() === requestedPathSegments[ii].toLowerCase()
            )
          ) {
            url = potentialMatchingConfiguredPathWithSegments[i].path
            const parseVersionNumber = url.match(/\d+/)
            const versionNumber = parseVersionNumber && parseInt(parseVersionNumber[0], 10)
            if (versionNumber && !availableRoutes.includes(versionNumber)) {
              availableRoutes.push(versionNumber)
            }
          }
        }
      }
      return url
    })
    return { [requestedPath]: availableRoutes }
  }

  // return matched routes value
  async appendAndGetAllCachedRoutes(routesList, requestedPath) {
    // checking if the routes exists to cached list of routes
    const allCachedRoutes = this.routesCache.get(routestMatchCacheKey)
    if (!_.isEmpty(allCachedRoutes) && allCachedRoutes[requestedPath]) {
      return allCachedRoutes
    }

    // if not found matching routes in cache then set those routes to cache
    const routesVersions = await this.getAvailableRoutes(routesList, requestedPath)
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
  static getInstance(server) {
    if (!RouteCacheSingleton.instance) {
      RouteCacheSingleton.instance = new RouteCache(server.table())
    }
    return RouteCacheSingleton.instance
  }
}

module.exports = RouteCacheSingleton
