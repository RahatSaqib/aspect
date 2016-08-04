class util{

  constructor(){
  }

  getBrowserNameAndVersion() {
    let browser = getBrowserInfo()

    if (!browser) {
      return 'Unknown'
    }

    return browser.name + ' ' + browser.version
  }

  // adds headers to every fetch request
  getHeaders(json){

    let headers = new Headers()

    if (window.localStorage.jwt){
      headers.append('Authorization', 'Bearer ' + window.localStorage.jwt)
    }

    if (json){
      headers.append('Content-Type', 'application/json')
    }

    return headers
  }

  // using this in a fetch (ajax request) to check if request was successful
  handleFetchError(resp) {

    let json = resp.json()

    if (resp.ok) {
      return json
    } else {
      return json.then(Promise.reject.bind(Promise))
    }
  }
}

export default new util()


function getBrowserInfo() {
  try {
    let ua = navigator.userAgent,
      tem, M = ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || []

    if (/trident/i.test(M[1])) {
      tem = /\brv[ :]+(\d+)/g.exec(ua) || []
      return { name: 'IE ', version: (tem[1] || '') }
    }

    if (M[1] === 'Chrome') {
      tem = ua.match(/\bOPR\/(\d+)/)
      if (tem != null) {
        return { name: 'Opera', version: tem[1] }
      }
    }

    M = M[2] ? [M[1], M[2]] : [navigator.appName, navigator.appVersion, '-?']

    if ((tem = ua.match(/version\/(\d+)/i)) != null) { M.splice(1, 1, tem[1]) }
    return {
      name: M[0],
      version: M[1]
    }
  } catch (e) {
    return null
  }
}
