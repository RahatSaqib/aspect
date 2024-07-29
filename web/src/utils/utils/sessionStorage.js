const VIEWED_PAGES_KEY = 'VIEWED_PAGES'

export function getViewedPages() {
  return sessionStorage.getItem(VIEWED_PAGES_KEY)
}

export function recordViewPage(path) {
  const viewedPages = getViewedPages()
  sessionStorage.setItem(VIEWED_PAGES_KEY, viewedPages ? viewedPages.concat(`,${path}`) : path)
}
