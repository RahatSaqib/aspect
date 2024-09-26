import * as Yup from 'yup'
import messages from '../../messages'

export const validationSchema = formatMessage =>
  Yup.object().shape({
    inventoryItemName: Yup.string().required(formatMessage(messages.inventoryItemNameRequired)),
    trackByExpiration: Yup.boolean(),
    includeLocation: Yup.boolean(),
    manufacturer: Yup.string().required(),
    partNumber: Yup.string(),
    price: Yup.number(),
    unit: Yup.string().required().oneOf([1]),
  })

export const initialValues = {
  inventoryItemName: '',
  trackByExpiration: false,
  includeLocation: false,
  manufacturer: '',
  partNumber: '',
  price: null,
  unit: 1,
}
