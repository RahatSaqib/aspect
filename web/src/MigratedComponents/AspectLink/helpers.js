const encodeQueryFromObject = obj => {
  let encodedQuery = ''
  Object.keys(obj || {}).forEach(oKey => {
    encodedQuery += `${oKey}=${obj[oKey]}&`
  })
  return encodeURIComponent(encodedQuery)
}

const hasObjectParams = params => Object.keys(params).filter(pKey => typeof params[pKey] === 'object').length > 0

/**
 * Based on a baseUrl and parameters, builds to whole URL converting the provided parameters on a query string.
 * If the params object contains at least 1 object, only the second level of keys will be encoded. For example:
 * If params = { filters: { a: 'a' }, b: 'b' }, then the query result will be '?filters=a%3Da&b=b&' (only the 'filters' section is encoded).
 * If params = { a: 'a', b: 'b' }, then the query result will be '?a%3Da%26b%3Db' (everything encoded).
 * This cames to bring support to the browse section, where we are using not encoded sections for filtering lists.
 * @param {string} baseUrl The base URL, like '/browse/result'
 * @param {object} params An object containing all key-value parameters.
 * @returns The builded URL
 */
export const buildURL = (baseUrl, params = {}) => {
  let urlQuery = ''
  const shouldDefineSections = hasObjectParams(params)
  Object.keys(params).forEach(pKey => {
    let pValue
    if (typeof params[pKey] === 'object') {
      // It is a parameter section (like filters in the browse page)
      pValue = `${pKey}=${encodeQueryFromObject(params[pKey])}&`
    } else if (shouldDefineSections) {
      // But we defined sections, then we do not encode param
      pValue = `${`${pKey}=${params[pKey]}`}&`
    } else {
      // And we did not define sections, then we encode param
      pValue = `${encodeURIComponent(`${pKey}=${params[pKey]}&`)}`
    }
    urlQuery += pValue
  })
  urlQuery = `${baseUrl}?${urlQuery}`
  return urlQuery
}

/**
 * Given an URL query like 'a%3Da%26b%3Db', returns an object representing the key-value pairs: { a: a, b: b }
 * @param {string} query The URL query to be parsed
 * @returns The object containing the key-value pairs
 */
export const getParamsFromQuery = query =>
  query
    ? JSON.parse(`{"${query.replace(/&/g, '","').replace(/=/g, '":"')}"}`, function (key, value) {
        return key === '' ? value : decodeURIComponent(value)
      })
    : {}

/**
 * Given a location, gets the key-value pairs object from the URL filters section. For example, from '?filters=a%3Da&b=b&' gets { a: 'a' }.
 * This function is specially useful for extracting filters section for the browse pages.
 * @param {Location} location The location object from where the URL should be gotten
 * @returns The object of key-value pairs parsed from the URL's filters section
 */
export const getFiltersObjectFromLocation = location => {
  const urlSearchParams = new URLSearchParams(location.search)
  const urlFilters = urlSearchParams.get('filters')
  return getParamsFromQuery(urlFilters)
}
