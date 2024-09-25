import * as Yup from 'yup'
import messages from '../messages'

export const validationSchema = formatMessage =>
  Yup.object().shape({
    inventoryItemName: Yup.string().required(formatMessage(messages.inventoryItemNameRequired)),
    trackByExpirationDate: Yup.boolean(),
    includeLocation: Yup.boolean(),
    manufacturer: Yup.string().required(),
    partNumber: Yup.string(),
    price: Yup.number(),
    unit: Yup.string().required().oneOf(['piece']),
  })

export const initialValues = {
  inventoryItemName: '',
  trackByExpirationDate: true,
  includeLocation: true,
  manufacturer: '',
  partNumber: '',
  price: 0,
  unit: 'piece',
}
