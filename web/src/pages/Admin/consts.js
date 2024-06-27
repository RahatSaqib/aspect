import { number, object, string } from 'yup'

export const stateFormValidation = object({
  name: string().trim().max(100).required(),
  abbreviation: string().max(50).trim().required(),
})

export const lgaFormValidation = object({
  name: string().trim().max(100).required(),
  stateId: number().nullable().required(),
})
