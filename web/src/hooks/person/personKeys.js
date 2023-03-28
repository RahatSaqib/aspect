const PERSON_KEY = 'PERSON'
const PERSON_KEY_BY_SITE_ID_ENDPOINT = '/person?siteId=:siteId'
const PERSON_KEY_AVAILABLE_ENDPOINT = '/person/available'
const PERSON_KEY_OPERATION_SITE_ID_ENDPOINT = '/person/:operation/:siteId'
const PERSON_KEY_BY_ID = '/person/:personId'
const PERSON_KEY_CURRENT_PERSON = '/account-details/current'
const PERSON_KEY_BASE = '/person'
const PERSON_SELF = '/account-details/current-contact'
const PERSON_KEY_LOGIN_DETAILS = '/auth/update-person-login-details/:personId'
const PERSON_KEY_ASSIGNMENTS_BY_PERSON_ID = '/job-function/person-assignments/:personId'
const PERSON_KEY_ASSIGNMENTS_DELETE = '/job-function/person-assignment/:personId/:jobContextId'
const PERSON_KEY_ASSIGNMENTS_CREATE = '/job-function/assign-person-to-job-and-context'
const PERSON_KEY_LIST = '/person/select-list'

export {
  PERSON_KEY,
  PERSON_KEY_BY_SITE_ID_ENDPOINT,
  PERSON_KEY_AVAILABLE_ENDPOINT,
  PERSON_KEY_OPERATION_SITE_ID_ENDPOINT,
  PERSON_KEY_BY_ID,
  PERSON_KEY_CURRENT_PERSON,
  PERSON_KEY_BASE,
  PERSON_SELF,
  PERSON_KEY_LOGIN_DETAILS,
  PERSON_KEY_ASSIGNMENTS_BY_PERSON_ID,
  PERSON_KEY_ASSIGNMENTS_DELETE,
  PERSON_KEY_ASSIGNMENTS_CREATE,
  PERSON_KEY_LIST,
}
