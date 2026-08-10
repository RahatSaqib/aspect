import { useNavigate } from 'react-router'
import useAuthState from '../useAuthState'
import useFilterUpdate from '../useFilterUpdate'

export const useResultlist = () => {
  const [, , , addMultipleFilter] = useFilterUpdate()
  const navigate = useNavigate()
  const user = useAuthState()

  const navigateToResultList = (resultFilters, graphFilters) => {
    const baseUrl = '/browse/result'

    addMultipleFilter([
      {
        newFilter: {
          countryId: user.countryId,
          displayResult: 'actual',
          ...resultFilters,
        },
        pathname: baseUrl,
      },
      {
        newFilter: graphFilters.newFilters,
        pathname: graphFilters.pathname,
      },
    ])

    navigate(baseUrl)
  }
  return { navigateToResultList }
}
