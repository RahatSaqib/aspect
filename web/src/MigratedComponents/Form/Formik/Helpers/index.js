import * as Yup from 'yup'
import get from 'lodash/get'
import messages from '../messages'

const mergeFormConfigWithData = (data, config) => {
  const { sections } = config
  sections.map(({ id, items }) =>
    items.map(item => (item.initialValue = get(data, item.key)))
  )
  return config
}

const pickKeys = (data, keys) => {
  const picked = {}
  data.map(({ items }) => {
    return items.map(
      ({ key, [keys]: keyToPick }) => (picked[key] = keyToPick || '')
    )
  })

  return picked
}

// const pickKeys = (data, keys) => {
//   console.log(data, keys)
//   return data.reduce((acc, curr) => {
//     const { id, initialValue } = curr
//     acc[id] = initialValue || ''
//     return acc
//   }, {})
// }

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

const createValidationSchema = (fields, intlFormatMessage) => {
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
                intlFormatMessage(messages[messageId], {
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

export {
  buildErrorMessage,
  createValidationSchema,
  buildLabel,
  mergeFormConfigWithData,
  pickKeys,
}
