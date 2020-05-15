import * as Yup from 'yup'

import messages from '../Forms/messages'

const pickKeys = (data, keys) =>
  data.reduce((acc, curr) => {
    acc[curr.id] = curr.initialValue ? curr.initialValue : ''
    return acc
  }, {})

const buildErrorMessage = (formik, id) => {
  let errorObject = {}
  const { touched, errors, validateOnMount } = formik

  switch (true) {
    case !!(validateOnMount && errors[id]):
      errorObject = { error: true, helperText: errors[id] }
      break

    case !!(!validateOnMount && errors[id] && touched[id]):
      errorObject = { error: true, helperText: errors[id] }
      break

    default:
      errorObject = { error: false, helperText: null }
      break
  }

  return errorObject
}

const createValidationSchema = (fields, { intl }) => {
  const yepSchema = fields.reduce((acc, curr) => {
    const { id, validationType, validation = [] } = curr
    if (Yup[validationType]) {
      let validator = Yup[validationType]()
      validation.forEach(item => {
        const { params, type } = item
        const { constraint, messageId } = params

        switch (true) {
          case type === 'matches' && Array.isArray(constraint):
            validator = validator[type](
              ...[
                new RegExp(`(${constraint.join('|')})`, 'gi'),
                intl.formatMessage(messages[messageId], {
                  options: constraint.join(', '),
                }),
              ].filter(p => p)
            )

            break

          default:
            validator = validator[type](
              ...[
                constraint,
                intl.formatMessage(messages[messageId], { total: constraint }),
              ].filter(p => p)
            )
            break
        }
      })
      acc[id] = validator
    }
    return acc
  }, {})

  return Yup.object().shape(yepSchema)
}

const buildLabel = (label, validation) => {
  const isrequired =
    validation && validation.length
      ? validation.filter(item => item.type === 'required').length > 0
      : false
  return `${label} ${isrequired ? '*' : ''}`
}

export { buildErrorMessage, createValidationSchema, buildLabel, pickKeys }
