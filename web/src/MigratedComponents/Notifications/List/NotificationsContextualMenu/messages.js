import { defineMessages } from 'react-intl'

const messages = defineMessages({
  editTitle: {
    id: 'contextualMenu.notifications.edit.title',
    defaultMessage: 'Edit',
  },
  copyTitle: {
    id: 'contextualMenu.notifications.copy.title',
    defaultMessage: 'Copy',
  },
  previewTitle: {
    id: 'contextualMenu.notifications.preview.title',
    defaultMessage: 'Preview',
  },
  viewLogTitle: {
    id: 'contextualMenu.notifications.viewLog.title',
    defaultMessage: 'View Log',
  },
  deleteTitle: {
    id: 'contextualMenu.notifications.delete.title',
    defaultMessage: 'Delete (Only 0 triggers)',
  },
  yesDelete: {
    id: 'contextualMenu.notifications.yesDelete',
    defaultMessage: 'Yes, delete it',
  },
  cancel: {
    id: 'contextualMenu.notifications.cancel',
    defaultMessage: 'Cancel',
  },
  areYouSureToDelete: {
    id: 'contextualMenu.notifications.areYouSureToDelete',
    defaultMessage: 'Are you sure to delete notification {notificationName}?',
  },
})

export default messages
