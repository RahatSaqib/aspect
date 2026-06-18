import * as Yup from 'yup'
import { validationErrorMessages } from '../../../../messages'

const coerceNullableNumber = (value, originalValue) => {
  if (originalValue === '' || originalValue === null || originalValue === undefined) return null
  const n = Number(originalValue)
  return Number.isFinite(n) ? n : value
}

const onlyWholeNumbersCallback = value => {
  if (value === null || value === undefined || value === '') return true
  return Number.isInteger(Number(value))
}

export const getValidationSchema = (formatMessage, isGeneXpert) =>
  Yup.object({
    // Hidden pass-through fields (not edited on this form); keep validation lenient.
    name: Yup.string()
      .nullable()
      .transform(value => value ?? ''),
    shortName: Yup.string()
      .nullable()
      .transform(value => value ?? ''),
    siteId: Yup.number().nullable(),
    implementingPartnerId: Yup.number().nullable(),
    dailyTestCapacity: Yup.number()
      .nullable()
      .transform(coerceNullableNumber)
      .test('no-decimals', formatMessage(validationErrorMessages.mustBeAWholeNumber), onlyWholeNumbersCallback)
      .test(
        'min-when-set',
        formatMessage(validationErrorMessages.mustBeAtLeast, { min: 1 }),
        value => value == null || value >= 1
      )
      .max(9999, formatMessage(validationErrorMessages.mustBeLessThan, { max: 9999 })),
    moduleBayCapacity: isGeneXpert
      ? Yup.number()
          .transform(coerceNullableNumber)
          .required(formatMessage(validationErrorMessages.required))
          .test('no-decimals', formatMessage(validationErrorMessages.mustBeAWholeNumber), onlyWholeNumbersCallback)
          .min(0, formatMessage(validationErrorMessages.mustBeAtLeast, { min: 0 }))
          .max(256, formatMessage(validationErrorMessages.mustBeLessThan, { max: 256 }))
      : Yup.number().nullable().transform(coerceNullableNumber),
    gx6cModulesCount: Yup.number()
      .nullable()
      .transform(coerceNullableNumber)
      .test('no-decimals', formatMessage(validationErrorMessages.mustBeAWholeNumber), onlyWholeNumbersCallback)
      .min(0, formatMessage(validationErrorMessages.mustBeAtLeast, { min: 0 })),
    gx10cModulesCount: Yup.number()
      .nullable()
      .transform(coerceNullableNumber)
      .test('no-decimals', formatMessage(validationErrorMessages.mustBeAWholeNumber), onlyWholeNumbersCallback)
      .min(0, formatMessage(validationErrorMessages.mustBeAtLeast, { min: 0 })),
    stickerInstrumentSerial: Yup.string().nullable(),
    instrumentModel: Yup.string().nullable(),
    softwareType: Yup.string().nullable(),
    isDaisyChained: Yup.boolean(),
    notes: Yup.string().nullable(),
    tags: Yup.array().of(Yup.object()),
  })
