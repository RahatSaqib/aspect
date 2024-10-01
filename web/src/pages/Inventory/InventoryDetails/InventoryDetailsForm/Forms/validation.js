import * as Yup from 'yup'

export const validationSchema = () =>
  Yup.object().shape({
    name: Yup.string().required('Item name is required'),
    trackByExpiration: Yup.boolean(),
    includeLocation: Yup.boolean(),
    manufacturer: Yup.string().required('Manufacturer is required'),
    partNumber: Yup.string(),
    price: Yup.number().nullable().typeError('Price must be a number'),
    unit: Yup.number().required('Unit is required'),
  })

export const initialValues = {
  name: '',
  trackByExpiration: false,
  includeLocation: false,
  manufacturer: '',
  partNumber: '',
  price: null,
  unit: 1,
}
