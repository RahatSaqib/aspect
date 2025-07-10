import * as Yup from 'yup'
import { validationMessages } from '../../../../messages'

export const getValidationSchema = formatMessage =>
  Yup.object({
    name: Yup.string().required(formatMessage(validationMessages.requiredField)),
    shortName: Yup.string().required(formatMessage(validationMessages.requiredField)),
    siteId: Yup.string().required(formatMessage(validationMessages.requiredField)),
    implementingPartnerId: Yup.string().nullable(),
    dailyTestCapacity: Yup.number()
      .nullable()
      .transform((value, originalValue) => (originalValue === '' ? null : value))
      .min(1, formatMessage(validationMessages.mustBeAtLeast, { min: 1 }))
      .max(9999, formatMessage(validationMessages.mustBeLessThan, { max: 9999 }))
      .integer(formatMessage(validationMessages.mustBeANumber)),
    moduleBayCapacity: Yup.number()
      .nullable()
      .transform((value, originalValue) => (originalValue === '' ? null : value))
      .min(1, formatMessage(validationMessages.mustBeAtLeast, { min: 1 }))
      .max(256, formatMessage(validationMessages.mustBeLessThan, { max: 256 }))
      .integer(formatMessage(validationMessages.mustBeANumber)),
    instrumentsConnected: Yup.number()
      .nullable()
      .transform((value, originalValue) => (originalValue === '' ? null : value))
      .min(1, formatMessage(validationMessages.mustBeAtLeast, { min: 1 }))
      .integer(formatMessage(validationMessages.mustBeANumber)),
    gx6cModulesCount: Yup.number()
      .nullable()
      .transform((value, originalValue) => (originalValue === '' ? null : value))
      .min(0, formatMessage(validationMessages.mustBeAtLeast, { min: 0 }))
      .integer(formatMessage(validationMessages.mustBeANumber)),
    gx10cModulesCount: Yup.number()
      .nullable()
      .transform((value, originalValue) => (originalValue === '' ? null : value))
      .min(0, formatMessage(validationMessages.mustBeAtLeast, { min: 0 }))
      .integer(formatMessage(validationMessages.mustBeANumber)),
    stickerInstrumentSerial: Yup.string().nullable(),
    instrumentModel: Yup.string().nullable(),
    softwareType: Yup.string().nullable(),
    isDaisyChained: Yup.boolean(),
    notes: Yup.string().nullable(),
    tags: Yup.array().of(Yup.object()),
  })
