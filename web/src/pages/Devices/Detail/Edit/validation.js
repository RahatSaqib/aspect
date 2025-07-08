import * as Yup from 'yup'
import messages from '../../../../components/Form/messages'

export const getValidationSchema = formatMessage =>
  Yup.object({
    name: Yup.string().required(formatMessage(messages.required, { field: 'Device Name' })),
    shortName: Yup.string().required(formatMessage(messages.required, { field: 'Short Name' })),
    siteId: Yup.string().required(formatMessage(messages.required, { field: 'Site' })),
    implementingPartnerId: Yup.string().nullable(),
    dailyTestCapacity: Yup.number()
      .nullable()
      .transform((value, originalValue) => (originalValue === '' ? null : value))
      .min(1, formatMessage(messages.min, { min: 1 }))
      .max(9999, formatMessage(messages.max, { max: 9999 }))
      .integer(formatMessage(messages.number)),
    moduleBayCapacity: Yup.number()
      .nullable()
      .transform((value, originalValue) => (originalValue === '' ? null : value))
      .min(1, formatMessage(messages.min, { min: 1 }))
      .max(256, formatMessage(messages.max, { max: 256 }))
      .integer(formatMessage(messages.number)),
    instrumentsConnected: Yup.number()
      .nullable()
      .transform((value, originalValue) => (originalValue === '' ? null : value))
      .min(1, formatMessage(messages.min, { min: 1 }))
      .integer(formatMessage(messages.number)),
    gx6cModulesCount: Yup.number()
      .nullable()
      .transform((value, originalValue) => (originalValue === '' ? null : value))
      .min(0, formatMessage(messages.min, { min: 0 }))
      .integer(formatMessage(messages.number)),
    gx10cModulesCount: Yup.number()
      .nullable()
      .transform((value, originalValue) => (originalValue === '' ? null : value))
      .min(0, formatMessage(messages.min, { min: 0 }))
      .integer(formatMessage(messages.number)),
    stickerInstrumentSerial: Yup.string().nullable(),
    instrumentModel: Yup.string().nullable(),
    softwareType: Yup.string().nullable(),
    isDaisyChained: Yup.boolean(),
    notes: Yup.string().nullable(),
    tags: Yup.array().of(Yup.object()),
  })
