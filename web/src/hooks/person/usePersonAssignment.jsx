import { useQuery } from 'react-query'
import fetchWrapperForQueries from '../../components/QueryFetch'
import { replaceRouteParams } from '../../components/QueryFetch/Helpers'
import { PERSON_KEY, PERSON_KEY_ASSIGNMENTS_BY_PERSON_ID } from './personKeys.js'

const getAssignment = async (personId, auth) =>
  fetchWrapperForQueries({
    endpoint: replaceRouteParams(PERSON_KEY_ASSIGNMENTS_BY_PERSON_ID, { personId }),
    customErrorNotifications: {
      /**
       * intercept 403 and throw local exception to handle in a `catch` block
       */
      403: ({ message }) => {
        throw new Error(JSON.stringify({ status: 403, message }))
      },
    },
  })
    .then(r => r.data)
    .catch(err => {
      /**
       * all non 403 errors should be handled by fetchWrapperForQueries, but in case
       * if something was not handled - forward non 403 error here
       */
      let status
      try {
        ;({ status } = JSON.parse(err.message))
      } catch {
        throw err
      }
      if (status !== 403) {
        throw err
      }
      /**
       * for 403 status code return either
       * - current user assignments (user should be able to view it's own assignments)
       * or
       * - empty array because user doesn't have permissions to edit job assignments (i.e. status code 403)
       * and should not be able to view them for any other person
       */
      if (personId === auth.personId) {
        return auth.assignments
      }
      return []
    })

const usePersonAssignment = (personId, auth) =>
  useQuery([PERSON_KEY, 'person', 'assignment', personId], async () => getAssignment(personId, auth))

export default usePersonAssignment
