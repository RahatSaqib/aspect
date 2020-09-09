import * as Yup from 'yup'
import get from 'lodash/get'
import isEmpty from 'lodash/isEmpty'

import messages from '../messages'

const mergeFormConfigWithData = (data, config) => {
  const { sections } = config
  if (!isEmpty(data)) {
    sections.map(({ rows }) =>
      rows.map(({ items }) =>
        items.reduce((acc, curr) => {
          acc = curr
          acc.label = get(data, curr.label) || curr.label
          acc.initialValue = get(data, curr.id)
          acc.link = curr.link
            ? {
                ...curr.link,
                url: curr.link.url.replace(
                  `:${curr.link.key}`,
                  get(data, curr.link.key)
                ),
              }
            : null
          return acc
        }, [])
      )
    )
  }
  return config
}

const pickKeys = (data, keys) => {
  const picked = {}
  if (data && data.length) {
    data.map(({ rows }) =>
      rows.map(({ items }) =>
        items.map(({ id, [keys]: keyToPick }) => (picked[id] = keyToPick || ''))
      )
    )
  }
  return picked
}

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
                intlFormatMessage(messages[messageId], { total: constraint }),
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
