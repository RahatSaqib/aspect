import { useQuery } from 'react-query'
import fetchWrapperForQueries from '../../components/QueryFetch'
import { replaceRouteParams } from '../../components/QueryFetch/Helpers'
import { PERSON_KEY, PERSON_KEY_CURRENT_PERSON, PERSON_KEY_BY_ID } from './personKeys.js'

const empty = {
  userId: '',
  username: '',
  name: '',
  title: '',
  email: '',
  email2: '',
  phone: '',
  cell: '',
  countryId: '',
  geographyId: '',
  stateId: '',
  lgaId: '',
  zip: '',
  timezone: '',
  culture: null,
  notes: '',
  lastPartnerId: '',
  hidePatientId: null,
  hideSampleId: null,
  hideNotes: null,
  country: '',
  stateName: '',
  lgaName: '',
  userLockedOut: 0,
  canLogIn: 0,
  disabled: 0,
  disabledOn: '',
  jobId: '',
  tags: [],
  jobFunctions: [],
  partnerId: '',
}

const getPerson = async personId =>
  personId === 'SELF'
    ? fetchWrapperForQueries({ endpoint: PERSON_KEY_CURRENT_PERSON }).then(r => r.data)
    : personId !== 'add'
    ? fetchWrapperForQueries({ endpoint: replaceRouteParams(PERSON_KEY_BY_ID, { personId }) }).then(r => r.data)
    : empty

const usePerson = id => useQuery([PERSON_KEY, 'person', id], () => getPerson(id), { cacheTime: 0 })

export default usePerson
