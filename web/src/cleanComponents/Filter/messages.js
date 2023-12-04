import {
  assay,
  consumableMessages,
  deviceApprovalMessages,
  deviceStatusMessages,
  resultCategory,
  resultTreatmentStatusMessages,
  resultWorkflowStatusMessages,
  notificationCategories,
} from '../../messages'
import allMessages from '../../messages/allMessages'

const messages = {
  ...consumableMessages,
  ...resultCategory,
  ...resultWorkflowStatusMessages,
  ...resultTreatmentStatusMessages,
  ...deviceStatusMessages,
  ...deviceApprovalMessages,
  ...assay,
  ...notificationCategories,
  ...allMessages,
}

export default messages
