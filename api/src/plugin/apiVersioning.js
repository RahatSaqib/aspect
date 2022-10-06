/* eslint-disable no-restricted-globals */
/* eslint-disable radix */
const Boom = require('@hapi/boom')
const Joi = require('@hapi/joi')
const MediaType = require('media-type')
const RouteCache = require('./routeCache')

const internals = {
  optionsSchema: Joi.object({
    defaultVersion: Joi.any().required(),
    versionHeader: Joi.string().trim().min(1).default('api-version'),
    mobileApiPath: Joi.string().trim().min(1).default('/'),
  }),
}

const extractVersionFromCustomHeader = function (request, options) {
  const apiVersionHeader = request.headers[options.versionHeader]

  if (!isNaN(apiVersionHeader)) {
    return parseInt(apiVersionHeader)
  }

  return null
}

const extractVersionFromAcceptHeader = function (request, options) {
  const acceptHeader = request.headers.accept
  const media = MediaType.fromString(acceptHeader)

  if (media.isValid() && /^vnd.[a-z][a-z0-9.!#$&^_-]{0,126}\.v[0-9]+$/i.test(media.subtype)) {
    const vendorFacets = media.subtypeFacets.slice(1, media.subtypeFacets.length - 1)
    const vendorName = vendorFacets.join('.')

    if (vendorName !== options.vendorName) {
      return null
    }

    const version = media.subtypeFacets[media.subtypeFacets.length - 1].slice(1)

    return parseInt(version)
  }

  return null
}

const extractVersionFromPath = function (request) {
  const versionedPathMatch = request.path.match(/{options.mobileApiPath}\/v(\d+)/)
  if (versionedPathMatch) {
    return parseInt(versionedPathMatch[1])
  }

  return null
}

// Set a response header containing the version number
const addVersionToResponseHeader = function (request, requestedVersion, options) {
  const headerName = options.versionHeader
  const { response } = request

  if (request.response.isBoom) {
    response.output.headers[headerName] = requestedVersion
  } else {
    response.header(headerName, requestedVersion)
  }
}

const attemptPathDecoding = function (request) {
  try {
    decodeURI(request.path)
  } catch (err) {
    throw Boom.badRequest('Invalid path')
  }
}

exports.name = 'apiVersioning'

exports.version = '1.0'

exports.register = (server, options) => {
  const validateOptions = internals.optionsSchema.validate(options)
  if (validateOptions.error) {
    throw new Error(validateOptions.error)
  }

  // Use the validated and maybe converted values from Joi
  options = validateOptions.value

  server.ext('onRequest', async (request, h) => {
    // Surface any URI decoding errors before calling server.match
    attemptPathDecoding(request)

    // First check for custom header
    let requestedVersion = extractVersionFromCustomHeader(request, options)

    // If no version check accept header
    if (typeof requestedVersion !== 'number') {
      requestedVersion = extractVersionFromAcceptHeader(request, options)
    }

    // If no version check route path
    if (typeof requestedVersion !== 'number') {
      requestedVersion = extractVersionFromPath(request, options)
    }

    // If passive mode skips the rest for non versioned routes
    if (options.passiveMode === true && typeof requestedVersion !== 'number') {
      return h.continue
    }

    // If there was a version by now check if it is valid
    if (typeof requestedVersion === 'number') {
      // reading all registered routes
      const table = server.table()
      const routesCache = RouteCache.getInstance(table)
      const routesList = await routesCache.getCacheValueRoute()
      const matchingRoutesList = []

      // preparing list of routes matching to versioned routes
      routesList.map(url => {
        if (url.replace(/v\d+[\\/]/gi, '').trim() === request.path) {
          matchingRoutesList.push(url)
        }
        return url
      })

      // finding available versions from matching versioned routes for mobileApiPath(/mobile/api/)
      const availableVersion = matchingRoutesList.map(list => parseInt(list.match(/\d+/)[0]))
      const largestNum = availableVersion ? Math.max(...availableVersion) : options.defaultVersion
      requestedVersion = largestNum > requestedVersion ? options.defaultVersion : largestNum
    }

    // If there was no version by now use the default version
    else {
      requestedVersion = options.defaultVersion
    }

    const versionedPath = `${options.mobileApiPath}v${requestedVersion}${request.path.slice(
      options.mobileApiPath.length - 1
    )}`

    let { method } = request
    if (request.method === 'options') {
      method = request.headers['access-control-request-method']
      if (!method) {
        throw Boom.badRequest('The Access-Control-Request-Method header must be set for CORS requests.')
      }
    }

    const route = server.match(method, versionedPath)

    if (route && route.path.indexOf(`${options.mobileApiPath}v${requestedVersion}/`) === 0) {
      request.setUrl(
        `${options.mobileApiPath}v${requestedVersion}${request.path.slice(options.mobileApiPath.length - 1)}${
          request.url.search || ''
        }`
      ) // required to preserve query parameters
    }

    // Set version for usage in handler
    request.pre.apiVersion = requestedVersion

    return h.continue
  })

  server.ext('onPreResponse', (request, h) => {
    addVersionToResponseHeader(request, request.pre.apiVersion, options)
    return h.continue
  })
}
