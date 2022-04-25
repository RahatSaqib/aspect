import { defineMessages } from 'react-intl'

export default defineMessages({
  editContact: {
    id: 'pages.Contacts.editContact',
    defaultMessage: 'Press enter to add tag',
  },
  create: {
    id: 'pages.Contacts.create',
    defaultMessage: 'Create',
  },
  save: {
    id: 'pages.Contacts.save',
    defaultMessage: 'Save',
  },
  disable: {
    id: 'pages.Contacts.disable',
    defaultMessage: 'Disable',
  },
  enable: {
    id: 'pages.Contacts.enable',
    defaultMessage: 'Enable',
  },
  personEmailExist: {
    id: 'pages.Contacts.person.email.exist',
    defaultMessage:
      'A person with the same email exists. Please use a different email.',
  },
  personEmailExistTitle: {
    id: 'pages.Contacts.person.email.exist.title',
    defaultMessage: 'Error creating person',
  },
})
