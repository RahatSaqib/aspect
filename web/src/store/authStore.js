import jwtDecode from 'jwt-decode'
import isNil from 'lodash/isNil'
import noop from 'lodash/noop'
import omitBy from 'lodash/omitBy'
import pick from 'lodash/pick'
import { defineMessages } from 'react-intl'
import config from '../config'
import { reasonTypes } from '../pages/Auth/loggedOutReasons'
import { errorPleaseTryAgainInAFewMinutes } from '../utils/error/CommonErrorNotifications'
import { getClientId, getClientName } from '../utils/utils/browser'
import { aspectFetch } from '../utils/utils/fetch'
import createStore from './createStore'
import { hideServiceDegradation, showServiceDegradation } from './serviceDegradationStore'

const previousCulture = localStorage.getItem('asCulture')
const currentCulture = config.defaultCulture

const initialJwt = {
  name: '',
  permissions: [],
  jobFunctionNames: [],
  hasToAcceptLicenseId: undefined,
  iat: undefined,
  exp: undefined,
  iss: '',
}

const initialState = {
  jwt: initialJwt,
  access: undefined,
  refresh: undefined,
  clientId: undefined,
  culture: previousCulture || currentCulture,
  timezoneId: 'Eastern Standard Time',
  displayPreferences: {},
  countryAbbreviation: null,
  loggedOutReason: '',
  licenseContent: undefined,
  countryId: undefined,
  userId: undefined,
  personId: undefined,
}

const authStore = createStore(initialState)

export const getAuthState = authStore.getState
export const useAuthStore = authStore.useStore

function authenticated(data) {
  authStore.setState(state => ({
    ...state,
    ...omitBy(data, isNil),
    licenseContent: undefined,
    jwt: {
      ...state.jwt,
      ...pick(jwtDecode(data.access), [
        'name',
        'permissions',
        'jobFunctionNames',
        'hasToAcceptLicenseId',
        'iat',
        'exp',
        'iss',
      ]),
    },
  }))
}

function loggedOut(reason) {
  sessionStorage.clear()
  authStore.setState({ ...initialState, loggedOutReason: reason })
}

export function userRequestedLogout() {
  loggedOut(reasonTypes.userRequested)
}

export function idleLogout() {
  loggedOut(reasonTypes.idle)
}

export function expiredTokenLogout() {
  loggedOut(reasonTypes.expiredJWT)
}

export function loginStart({ user, password }) {
  hideServiceDegradation()
  const clientId = localStorage.getItem('asClientId') || getClientId()
  return (
    aspectFetch('/auth', {
      method: 'POST',
      body: JSON.stringify({
        name: user,
        password,
        clientId,
        clientType: 'web',
        clientName: getClientName(),
      }),
      errorNotifications: {
        401: {
          'Authentication failed. Wrong username or password.': {
            severity: 'warn',
            ...defineMessages({
              title: {
                id: 'errorResponseMessages.loginStart.POST.401.authenticationFailed.title',
                defaultMessage: 'Login Failed',
              },
              message: {
                id: 'errorResponseMessages.loginStart.POST.401.authenticationFailed.message',
                defaultMessage: 'Incorrect username or password',
              },
              resolution: {
                id: 'errorResponseMessages.loginStart.POST.401.authenticationFailed.resolution',
                defaultMessage: 'Please, correct the credentials your entered and try again.',
              },
            }),
          },
          'Incorrect password': {
            severity: 'warn',
            ...defineMessages({
              title: {
                id: 'errorResponseMessages.loginStart.POST.401.incorrectPassword.title',
                defaultMessage: 'Could not update your credentials',
              },
              message: {
                id: 'errorResponseMessages.loginStart.POST.401.incorrectPassword.message',
                defaultMessage: 'The password you entered is incorrect',
              },
              resolution: {
                id: 'errorResponseMessages.loginStart.POST.401.incorrectPassword.resolution',
                defaultMessage: 'Please, re-enter your password and try again.',
              },
            }),
          },
          'There was a conflict with your GxAlert credentials': {
            severity: 'warn',
            ...defineMessages({
              title: {
                id: 'errorResponseMessages.loginStart.POST.409.thereWasAConflictWithYourCredentials.title',
                defaultMessage: "Couldn't login with your credentials",
              },
              message: {
                id: 'errorResponseMessages.loginStart.POST.409.thereWasAConflictWithYourCredentials.message',
                defaultMessage:
                  'There was a conflict with your credentials. Please, contact an administrator for support.',
              },
            }),
          },
        },
        409: {
          "Couldn't connect to GxAlert": {
            severity: 'warn',
            ...defineMessages({
              title: {
                id: 'errorResponseMessages.loginStart.POST.409.couldntConnectToGxAlert.title',
                defaultMessage: 'Login failed',
              },
              message: {
                id: 'errorResponseMessages.loginStart.POST.409.couldntConnectToGxAlert.message',
                defaultMessage:
                  "We couldn't establish connection with GxAlert. If you are trying to login with an Aspect user, you probably entered invalid credentials.",
              },
            }),
          },
        },
        403: {
          default: data => {
            showServiceDegradation({ message: data.message, variant: 'error' })
          },
          'Your account is locked.': {
            severity: 'warn',
            ...defineMessages({
              title: {
                id: 'errorResponseMessages.loginStart.POST.403.accountLocked.title',
                defaultMessage: 'Login failed',
              },
              message: {
                id: 'errorResponseMessages.loginStart.POST.403.accountLocked.message',
                defaultMessage: 'Your user account has been locked',
              },
              resolution: {
                id: 'errorResponseMessages.loginStart.POST.403.accountLocked.resolution',
                defaultMessage: 'You can contact us to unlock your account for you by email ({supportEmail})',
              },
            }),
            messageValues: {
              supportEmail: config.supportEmail,
            },
          },
        },
        417: {
          'Your credentials were not configured properly. Please, contact your administrator.': {
            severity: 'warn',
            ...defineMessages({
              title: {
                id: 'errorResponseMessages.loginStart.POST.417.missingPermissions.title',
                defaultMessage: 'Login failed',
              },
              message: {
                id: 'errorResponseMessages.loginStart.POST.417.missingPermissions.message',
                defaultMessage: 'Your credentials were not configured properly. Please, contact your administrator.',
              },
              resolution: {
                id: 'errorResponseMessages.loginStart.POST.417.missingPermissions.resolution',
                defaultMessage: 'You can contact us to check your account by email ({supportEmail})',
              },
            }),
            messageValues: {
              supportEmail: config.supportEmail,
            },
          },
        },
        default: errorPleaseTryAgainInAFewMinutes(
          defineMessages({
            title: {
              id: 'errorResponseMessages.loginStart.POST.default.title',
              defaultMessage: 'Login Error',
            },
          })
        ),
      },
    })
      .then(json => {
        if (json.activeStatus === 1 && json.statusMessage) {
          showServiceDegradation({ message: json.statusMessage, variant: 'warning' })
        }
        if (json.notificationWarningMessage) {
          showServiceDegradation({ message: json.notificationWarningMessage, variant: 'warning' })
        }
        authenticated({
          access: json.access,
          refresh: json.refresh,
          clientId: json.clientId,
          countryId: json.countryId,
          culture: json.culture,
          countryAbbreviation: json.countryAbbreviation,
          timezoneId: json.timezone,
          displayPreferences: json.displayPreferences,
          loggedOutReason: '',
          userId: json.userId,
          personId: json.personId,
        })
      })
      // failures are already reported to the user by aspectFetch
      .catch(noop)
  )
}

export function refreshStart() {
  const token = localStorage.getItem('asRefresh')
  if (!token) {
    return Promise.resolve()
  }

  const clientId = localStorage.getItem('asClientId')
  // try to get a new access token:
  return aspectFetch('/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ token, clientId, clientType: 'web' }),
  })
    .then(json =>
      authenticated({
        access: json.access,
        refresh: json.refresh,
        clientId: json.clientId,
        countryId: json.countryId,
        culture: json.culture,
        countryAbbreviation: json.countryAbbreviation,
        timezoneId: json.timezone,
        displayPreferences: json.displayPreferences,
        userId: json.userId,
        personId: json.personId,
      })
    )
    .catch(() => {
      loggedOut(reasonTypes.refreshJWTFailure)
    })
}

export function fetchLicense(licenseId) {
  return aspectFetch(`/auth/license?licenseId=${licenseId}`).then(json =>
    authStore.setState(state => ({ ...state, licenseContent: json.data.content }))
  )
}

export function acceptLicenseStart(licenseId) {
  const { clientId, refresh } = getAuthState()

  return aspectFetch('/auth/license', {
    method: 'POST',
    body: JSON.stringify({
      licenseId,
      clientId,
      token: refresh,
    }),
    errorNotifications: {
      default: errorPleaseTryAgainInAFewMinutes(
        defineMessages({
          title: {
            id: 'errorResponseMessages.loginStart.POST.default.title',
            defaultMessage: 'Login Error',
          },
        })
      ),
    },
  }).then(json =>
    authenticated({
      access: json.access,
      refresh: json.refresh,
      clientId: json.clientId,
      culture: json.culture,
      countryAbbreviation: json.countryAbbreviation,
      timezoneId: json.timezone,
      displayPreferences: json.displayPreferences,
      countryId: json.countryId,
    })
  )
}

export function updateSessionTokens({ access, refresh, clientId }) {
  authenticated({ access, refresh, clientId })
}
