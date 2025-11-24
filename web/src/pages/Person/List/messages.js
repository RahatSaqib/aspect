import { defineMessages } from 'react-intl'
import { commonDefinitions } from '../../../messages/customMessages'

const messages = {
  ...commonDefinitions,
  ...defineMessages({
    contactsTitle: {
      id: 'pages.PersonList.title',
      defaultMessage: 'Contacts',
    },
    personName: {
      id: 'pages.PersonList.personName',
      defaultMessage: 'Name',
    },
    assignments: {
      id: 'pages.PersonList.assignments',
      defaultMessage: 'Assignments',
    },
    paginatorStatus: {
      id: 'pages.PersonList.paginatorStatus',
      defaultMessage: `Showing {firstItemIndex}-{lastItemIndex} of {itemCount, plural,
      one {# contact}
      other {# contacts}
    }`,
    },
    tags: {
      id: 'pages.PersonList.tags',
      defaultMessage: 'Tags',
    },
    cell: {
      id: 'pages.PersonList.cell',
      defaultMessage: 'Cell',
    },
    email: {
      id: 'pages.PersonList.email',
      defaultMessage: 'Email',
    },
    phone: {
      id: 'pages.PersonList.phone',
      defaultMessage: 'Phone',
    },
    lastLogin: {
      id: 'pages.PersonList.lastLogin',
      defaultMessage: 'Last Login',
    },
    addContact: {
      id: 'pages.PersonList.addContact',
      defaultMessage: 'New Contact',
    },
    disable: {
      id: 'pages.PersonList.disable',
      defaultMessage: 'Do you want to disable',
    },
    enable: {
      id: 'pages.PersonList.enable',
      defaultMessage: 'Do you want to enable',
    },
    yes: {
      id: 'pages.PersonList.confirm',
      defaultMessage: 'Yes',
    },
    cancel: {
      id: 'pages.PersonList.cancel',
      defaultMessage: 'Cancel',
    },
    enableDisable: {
      id: 'pages.PersonList.enableDisable',
      defaultMessage: 'Enable/Disable User',
    },
  }),
}

export default messages
