import { useEffect } from 'react'
import { useMutation } from 'react-query'
import { useLocation } from 'react-router-dom'
import fetchWrapperForQueries from '../../components/QueryFetch'
import { getViewedPages, recordViewPage } from '../../utils/utils/sessionStorage'

export default function RecordPageViewProvider({ children }) {
  const { pathname } = useLocation()

  const { mutate: recordPageView } = useMutation(
    () => fetchWrapperForQueries({ endpoint: '/person/record-page-view', method: 'GET' }),
    {
      onSuccess: (data, pathname) => recordViewPage(pathname),
    }
  )

  useEffect(() => {
    const viewedPages = getViewedPages()?.split(',') ?? []
    const isRecorded = viewedPages.find(i => i === pathname)
    if (!isRecorded && pathname !== '/') recordPageView(pathname)
  }, [pathname, recordPageView])

  return children
}
