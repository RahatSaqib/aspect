import { useQuery } from 'react-query'
import fetchWrapperForQueries from '../../components/QueryFetch'
import { SELECTS_QUERY_OPTIONS } from '../../utils/consts/ReactQuery/CONSTS'
import { DISEASE_KEY, DISEASE_KEY_LIST_ENDPOINT } from './diseaseKeys.js'

const getDiseases = async () => {
  return fetchWrapperForQueries({ endpoint: DISEASE_KEY_LIST_ENDPOINT }).then(response =>
    response.data.map(({ id, i18nKey }) => ({ id, i18nKey }))
  )
}

const useDiseaseList = () => useQuery([DISEASE_KEY, 'list'], () => getDiseases(), { ...SELECTS_QUERY_OPTIONS })

export default useDiseaseList
