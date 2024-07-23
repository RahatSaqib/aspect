import { useEffect } from 'react'
import { useMutation } from 'react-query'
import { useLocation } from 'react-router-dom'
import fetchWrapperForQueries from '../../components/QueryFetch'
import useAuthState from '../../hooks/useAuthState'

const recordedPages = []

export default function RecordPageViewProvider({ children }) {
  const { pathname } = useLocation()
  const user = useAuthState()

  const { mutate: recordPageView } = useMutation(
    () => fetchWrapperForQueries({ endpoint: '/person/record-page-view', method: 'GET' }),
    {
      onSuccess: (data, pathname) => recordedPages.push(pathname),
    }
  )

  useEffect(() => {
    const isRecorded = recordedPages.find(i => i === pathname)
    if (!isRecorded && user.jwt) recordPageView(pathname)
  }, [pathname, recordPageView, user.jwt])

  return children
}
