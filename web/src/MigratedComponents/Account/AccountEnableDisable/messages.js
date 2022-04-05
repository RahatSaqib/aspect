import { defineMessages } from 'react-intl'

export default defineMessages({
  cancel: {
    id: 'pages.PersonList.disabled.cancel',
    defaultMessage: 'Cancel',
  },
  yes: {
    id: 'pages.PersonList.disabled.yes',
    defaultMessage: 'Yes',
  },
  enableUser: {
    id: 'pages.PersonList.disabled.enableUser',
    defaultMessage:
      'This will enable this user again, and they will be able to login again. Would you like to continue?',
  },
  disableUser: {
    id: 'pages.PersonList.disabled.disableUser',
    defaultMessage:
      'This will disable this user, and they will not be able to login. Would you like to continue?',
  },
  disabledOn: {
    id: 'pages.PersonList.disabled.disabledOn',
    defaultMessage: 'This person was disabled on',
  },
})
