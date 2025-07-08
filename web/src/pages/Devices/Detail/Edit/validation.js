import * as Yup from 'yup'

export const getValidationSchema = formatMessage =>
  Yup.object({
    name: Yup.string().required('Device name is required'),
    shortName: Yup.string().required('Short name is required'),
    siteId: Yup.string().required('Site is required'),
    implementingPartnerId: Yup.string().nullable(),
    dailyTestCapacity: Yup.number()
      .nullable()
      .transform((value, originalValue) => (originalValue === '' ? null : value))
      .min(1, 'Must be at least 1')
      .max(9999, 'Must be less than 10000')
      .integer('Must be a number'),
    moduleBayCapacity: Yup.number()
      .nullable()
      .transform((value, originalValue) => (originalValue === '' ? null : value))
      .min(1, 'Must be at least 1')
      .max(256, 'Must be less than 257')
      .integer('Must be a number'),
    instrumentsConnected: Yup.number()
      .nullable()
      .transform((value, originalValue) => (originalValue === '' ? null : value))
      .min(1, 'Must be at least 1')
      .integer('Must be a number'),
    gx6cModulesCount: Yup.number()
      .nullable()
      .transform((value, originalValue) => (originalValue === '' ? null : value))
      .min(0, 'Must be at least 0')
      .integer('Must be a number'),
    gx10cModulesCount: Yup.number()
      .nullable()
      .transform((value, originalValue) => (originalValue === '' ? null : value))
      .min(0, 'Must be at least 0')
      .integer('Must be a number'),
    stickerInstrumentSerial: Yup.string().nullable(),
    instrumentModel: Yup.string().nullable(),
    softwareType: Yup.string().nullable(),
    isDaisyChained: Yup.boolean(),
    notes: Yup.string().nullable(),
    tags: Yup.array().of(Yup.object()),
  })
