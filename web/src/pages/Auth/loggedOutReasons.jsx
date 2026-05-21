import has from 'lodash/has'
import reduce from 'lodash/reduce'
import set from 'lodash/set'
import { defineMessages } from 'react-intl'

const reasonTypeList = [
  {
    type: 'userRequested',
    i18nKey: 'reasonUserRequested',
  },
  {
    type: 'idle',
    i18nKey: 'reasonIdle',
  },
  {
    type: 'expiredJWT',
    i18nKey: 'reasonExpiredJWT',
  },
  {
    type: 'refreshJWTFailure',
    i18nKey: 'reasonRefreshJWTFailure',
  },
]

export const reasonTypes = reduce(reasonTypeList, (acc, { type }) => set(acc, type, type), {})

export const typeToMessage = type => has(i18nKeyByType, type) && messages[i18nKeyByType[type]]

const i18nKeyByType = reduce(reasonTypeList, (acc, { type, i18nKey }) => set(acc, type, i18nKey), {})

const messages = defineMessages({
  [i18nKeyByType.userRequested]: {
    id: 'pages.Login.reasonUserRequested',
    defaultMessage: "You've successfully logged out",
  },
  [i18nKeyByType.idle]: {
    id: 'pages.Login.reasonIdle',
    defaultMessage: 'You were logged out due to inactivity',
  },
  [i18nKeyByType.expiredJWT]: {
    id: 'pages.Login.reasonExpiredJWT',
    defaultMessage: 'You were logged out due to an expired session',
  },
  [i18nKeyByType.refreshJWTFailure]: {
    id: 'pages.Login.reasonRefreshJWTFailure',
    defaultMessage: 'You were logged out due to refreshing session failure',
  },
})
