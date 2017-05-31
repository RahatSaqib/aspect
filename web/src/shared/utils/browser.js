export function isMobile() {
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Browser_detection_using_the_user_agent
  try {
    const ua = navigator.userAgent
    return /Mobi/.test(ua)
  } catch (e) {
    return false
  }
}

export function getBrowserNameAndVersion() {
  const browser = getBrowserInfo()

  if (!browser) {
    return 'Unknown'
  }

  return `${browser.name} ${browser.version}`
}

// returns name and version of the user's browser
function getBrowserInfo() {
  try {
    const ua = navigator.userAgent
    let tem
    let M = ua.match(
      /(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i
    ) || []

    if (/trident/i.test(M[1])) {
      tem = /\brv[ :]+(\d+)/g.exec(ua) || []
      return { name: 'IE ', version: tem[1] || '' }
    }

    if (M[1] === 'Chrome') {
      tem = ua.match(/\bOPR\/(\d+)/)
      if (tem != null) {
        return { name: 'Opera', version: tem[1] }
      }
    }

    M = M[2] ? [M[1], M[2]] : [navigator.appName, navigator.appVersion, '-?']

    tem = ua.match(/version\/(\d+)/i)

    if (tem != null) {
      M.splice(1, 1, tem[1])
    }
    return {
      name: M[0],
      version: M[1],
    }
  } catch (e) {
    return null
  }
}
