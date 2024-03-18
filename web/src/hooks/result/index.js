const { useNavigate } = require('react-router')
const { default: useAuthState } = require('../useAuthState')
const { default: useFilterUpdate } = require('../useFilterUpdate')

export const useResultlist = () => {
  const [addFilter] = useFilterUpdate()
  const navigate = useNavigate()
  const user = useAuthState()

  const navigateToResultList = filters => {
    const baseUrl = '/browse/result'

    addFilter(
      {
        countryId: user.countryId,
        displayResult: 'actual',
        ...filters,
      },
      baseUrl
    )
    navigate(baseUrl)
  }
  return [navigateToResultList]
}
