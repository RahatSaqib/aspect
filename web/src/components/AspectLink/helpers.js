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
