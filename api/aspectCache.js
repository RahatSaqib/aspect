const NodeCache = require('node-cache')
/**
 * General purpose cache
 */
class AspectCache {
  #predefinedEntryNamePrefix = '____'

  // adding an entry name here will make the entry avaiable with custom async getter and setter methods,
  // e.g. `async cache.getVersion()` / `async cache.setVersion(value)`
  // (see this.#createPredefinedAccessors method.)
  #predefinedEntries = ['Version']

  constructor(ttl = 0) {
    this.cache = new NodeCache({ stdTTL: ttl })
    this.#createPredefinedAccessors()
  }

  async setValue(key, value) {
    this.cache.set(key, value)
  }

  async getValue(key) {
    return this.cache.get(key)
  }

  /**
   * Creates an async getter and setter function for each entry in #predefinedEntries array
   * e.g. for 'Version' item, creates `async cache.getVersion()` and `async cache.setVersion(value)`.
   */
  #createPredefinedAccessors() {
    this.#predefinedEntries.forEach(entryName => {
      this[`get${entryName}`] = async () => this.getValue(`${this.#predefinedEntryNamePrefix}${entryName}`)
      this[`set${entryName}`] = async value => this.setValue(`${this.#predefinedEntryNamePrefix}${entryName}`, value)
    })
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
