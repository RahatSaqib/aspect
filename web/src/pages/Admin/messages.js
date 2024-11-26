import { defineMessages } from 'react-intl'
import { commonDefinitions } from '../../messages'

export default {
  ...commonDefinitions,
  ...defineMessages({
    createNew: {
      id: 'admin.page.states.createNew',
      defaultMessage: 'Create New',
    },
    deleteConfirmation: {
      id: 'admin.page.removeConfirmation',
      defaultMessage: 'Are you sure to delete this {entity}?',
    },
    manage: {
      id: 'admin.page.states.manage',
      defaultMessage: 'Manage',
    },
    edit: {
      id: 'pages.admin.edit',
      defaultMessage: 'Edit',
    },
    delete: {
      id: 'pages.admin.delete',
      defaultMessage: 'Delete',
    },
    cancel: {
      id: 'pages.admin.cancel',
      defaultMessage: 'Cancel',
    },
    yes: {
      id: 'pages.admin.yes',
      defaultMessage: 'Yes',
    },
    create: {
      id: 'pages.admin.create',
      defaultMessage: 'Create',
    },
    name: {
      id: 'pages.admin.name',
      defaultMessage: 'Name',
    },
    abbreviation: {
      id: 'pages.admin.abbreviation',
      defaultMessage: 'Abbreviation',
    },
    apiKeys: {
      id: 'pages.admin.apiKeys',
      defaultMessage: 'Api Keys',
    },
    people: {
      id: 'pages.admin.people',
      defaultMessage: 'People',
    },
    sites: {
      id: 'pages.admin.sites',
      defaultMessage: 'Sites',
    },
    issues: {
      id: 'pages.admin.issues',
      defaultMessage: 'Issues',
    },
    deviceConfigurations: {
      id: 'pages.admin.deviceConfigurations',
      defaultMessage: 'Device Configurations',
    },
    notificationStates: {
      id: 'pages.admin.notificationStates',
      defaultMessage: 'Notification States',
    },
    peopleWithAccess: {
      id: 'pages.admin.peopleWithAccess',
      defaultMessage: 'People With Access to State',
    },
    statesPaginatorStatus: {
      id: 'pages.admin.states.paginatorStatus',
      defaultMessage: `Showing {firstItemIndex}-{lastItemIndex} of {itemCount, plural,
      one {# }
      other {# }
    }`,
    },
    lgaPaginatorStatus: {
      id: 'pages.admin.lga.paginatorStatus',
      defaultMessage: `Showing {firstItemIndex}-{lastItemIndex} of {itemCount, plural,
      one {# }
      other {# }
    }`,
    },
  }),
}
