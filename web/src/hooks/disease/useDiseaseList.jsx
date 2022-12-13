import { useQuery } from 'react-query'
import fetchWrapperForQueries from '../../components/QueryFetch'
import { DISEASE_KEY, DISEASE_KEY_LIST_ENDPOINT } from './diseaseKeys.js'

const getDiseases = async () => {
  return fetchWrapperForQueries({ endpoint: DISEASE_KEY_LIST_ENDPOINT }).then(response =>
    response.data.map(({ id, i18nKey }) => ({ id, i18nKey }))
  )
}

const useDiseaseList = () => useQuery([DISEASE_KEY, 'list'], () => getDiseases())

export default useDiseaseList
