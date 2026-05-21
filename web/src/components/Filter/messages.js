import {
  assay,
  consumableMessages,
  deviceApprovalMessages,
  deviceStatusMessages,
  resultCategory,
  resultTreatmentStatusMessages,
  notificationCategories,
} from '../../messages'
import allMessages from '../../messages/allMessages'

const messages = {
  ...consumableMessages,
  ...resultCategory,
  ...resultTreatmentStatusMessages,
  ...deviceStatusMessages,
  ...deviceApprovalMessages,
  ...assay,
  ...notificationCategories,
  ...allMessages,
}

export default messages
