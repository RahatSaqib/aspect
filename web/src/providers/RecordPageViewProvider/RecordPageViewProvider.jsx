import { useEffect } from 'react'
import { useMutation } from 'react-query'
import { useLocation } from 'react-router-dom'
import fetchWrapperForQueries from '../../components/QueryFetch'

const recordedPages = []

export default function RecordPageViewProvider({ children }) {
  const { pathname } = useLocation()
  const { mutate: recordPageView } = useMutation(
    () => fetchWrapperForQueries({ endpoint: '/person/record-page-view', method: 'GET' }),
    {
      onSuccess: (data, pathname) => recordedPages.push(pathname),
    }
  )

  useEffect(() => {
    const isRecorded = recordedPages.find(i => i === pathname)
    if (!isRecorded) recordPageView(pathname)
  }, [pathname, recordPageView])

  return children
}
