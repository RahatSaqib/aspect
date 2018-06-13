import _ from 'lodash'
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

export const reasonTypes = _.reduce(
  reasonTypeList,
  (acc, { type }) => _.set(acc, type, type),
  {}
)

export const typeToMessage = type =>
  _.has(i18nKeyByType, type) && messages[i18nKeyByType[type]]

const i18nKeyByType = _.reduce(
  reasonTypeList,
  (acc, { type, i18nKey }) => _.set(acc, type, i18nKey),
  {}
)

const messages = defineMessages({
  [i18nKeyByType.userRequested]: {
    id: `pages.Login.${i18nKeyByType.userRequested}`,
    defaultMessage: "You've successfully logged out",
  },
  [i18nKeyByType.idle]: {
    id: `pages.Login.${i18nKeyByType.idle}`,
    defaultMessage: 'You were logged out due to inactivity',
  },
  [i18nKeyByType.expiredJWT]: {
    id: `pages.Login.${i18nKeyByType.expiredJWT}`,
    defaultMessage: 'You were logged out due to an expired session',
  },
  [i18nKeyByType.refreshJWTFailure]: {
    id: `pages.Login.${i18nKeyByType.refreshJWTFailure}`,
    defaultMessage: 'You were logged out due to refreshing session failure',
  },
})
