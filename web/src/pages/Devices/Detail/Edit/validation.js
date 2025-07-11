import * as Yup from 'yup'
import { validationErrorMessages } from '../../../../messages'

const onlyWholeNumbersCallback = value => {
  if (value === null || value === undefined) return true
  return Number.isInteger(value)
}

export const getValidationSchema = formatMessage =>
  Yup.object({
    name: Yup.string().required(formatMessage(validationErrorMessages.required)),
    shortName: Yup.string().required(formatMessage(validationErrorMessages.required)),
    siteId: Yup.string().required(formatMessage(validationErrorMessages.required)),
    implementingPartnerId: Yup.string().nullable(),
    dailyTestCapacity: Yup.number()
      .nullable()
      .transform((value, originalValue) => (originalValue === '' ? null : value))
      .test('no-decimals', formatMessage(validationErrorMessages.mustBeAWholeNumber), onlyWholeNumbersCallback)
      .min(1, formatMessage(validationErrorMessages.mustBeAtLeast, { min: 1 }))
      .max(9999, formatMessage(validationErrorMessages.mustBeLessThan, { max: 9999 })),
    moduleBayCapacity: Yup.number()
      .required(formatMessage(validationErrorMessages.required))
      .test('no-decimals', formatMessage(validationErrorMessages.mustBeAWholeNumber), onlyWholeNumbersCallback)
      .min(1, formatMessage(validationErrorMessages.mustBeAtLeast, { min: 1 }))
      .max(256, formatMessage(validationErrorMessages.mustBeLessThan, { max: 256 })),
    instrumentsConnected: Yup.number()
      .nullable()
      .transform((value, originalValue) => (originalValue === '' ? null : value))
      .test('no-decimals', formatMessage(validationErrorMessages.mustBeAWholeNumber), onlyWholeNumbersCallback)
      .min(1, formatMessage(validationErrorMessages.mustBeAtLeast, { min: 1 })),
    gx6cModulesCount: Yup.number()
      .nullable()
      .transform((value, originalValue) => (originalValue === '' ? null : value))
      .test('no-decimals', formatMessage(validationErrorMessages.mustBeAWholeNumber), onlyWholeNumbersCallback)
      .min(0, formatMessage(validationErrorMessages.mustBeAtLeast, { min: 0 })),
    gx10cModulesCount: Yup.number()
      .nullable()
      .transform((value, originalValue) => (originalValue === '' ? null : value))
      .test('no-decimals', formatMessage(validationErrorMessages.mustBeAWholeNumber), onlyWholeNumbersCallback)
      .min(0, formatMessage(validationErrorMessages.mustBeAtLeast, { min: 0 })),
    stickerInstrumentSerial: Yup.string().nullable(),
    instrumentModel: Yup.string().nullable(),
    softwareType: Yup.string().nullable(),
    isDaisyChained: Yup.boolean(),
    notes: Yup.string().nullable(),
    tags: Yup.array().of(Yup.object()),
  })
