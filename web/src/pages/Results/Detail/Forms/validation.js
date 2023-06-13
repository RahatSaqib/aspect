import * as Yup from 'yup'
import messages from './validationMessages'

const getValidationSchema = formatMessage =>
  Yup.object().shape({
    resultTypeId: Yup.string().when('excluded', {
      is: true,
      then: Yup.string().test({
        message: formatMessage(messages.resultTypeIdRequired),
        test: v => {
          return v !== '1' // `Patient` resultTypeId (id:1) is not allowed for excluded results.
        },
      }),
    }),
  })

export default getValidationSchema
