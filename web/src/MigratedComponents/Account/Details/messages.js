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
  personNameExist: {
    id: 'pages.Contacts.person.name.exist',
    defaultMessage:
      'A person with the same name exists. Please use a different name.',
  },
  personNameExistTitle: {
    id: 'pages.Contacts.person.name.exist.title',
    defaultMessage: 'Error creating person',
  },
})
