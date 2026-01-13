import { useQuery } from 'react-query'
import fetchWrapperForQueries from '../../components/QueryFetch'
import { replaceRouteParams } from '../../components/QueryFetch/Helpers'

const CANDIDATE_INSTRUMENTS_KEY = 'candidate-instruments'
const CANDIDATE_INSTRUMENTS_ENDPOINT = '/device/:deviceId/candidate-instruments'

const getCandidateInstruments = async deviceId =>
  fetchWrapperForQueries({ endpoint: replaceRouteParams(CANDIDATE_INSTRUMENTS_ENDPOINT, { deviceId }) }).then(
    response => response.data.instruments
  )

const useCandidateInstruments = deviceId =>
  useQuery([CANDIDATE_INSTRUMENTS_KEY, deviceId], () => getCandidateInstruments(deviceId), {
    enabled: !!deviceId,
  })

export default useCandidateInstruments
