import * as Yup from 'yup'
import get from 'lodash/get'
import isEmpty from 'lodash/isEmpty'
import isFunction from 'lodash/isFunction'
import cloneDeep from 'lodash/cloneDeep'

import messages from '../messages'

const mergeFormConfigWithData = (data, config, messages) => {
  const configToMutate = {
    ...cloneDeep(config),
    messages,
  }
  const { sections } = configToMutate
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
  return configToMutate
}

const getInitialValuesFromFormConfig = config => {
  const initialValues = {}
  const { sections } = config
  sections.forEach(({ rows }) => {
    rows.forEach(({ items }) => {
      items.forEach(({ controlType = {}, id, initialValue }) => {
        const { component } = controlType
        let value = initialValue
        if (component === 'checkbox') {
          value = initialValue === true
        }
        initialValues[id] = value
      })
    })
  })

  return initialValues
}

const pickKeys = (data, key, defaultValue) => {
  const picked = {}
  if (data && data.length) {
    data.forEach(({ rows }) => {
      rows.forEach(({ items }) => {
        items.forEach(
          ({ controlType: { component } = {}, id, [key]: keyToPick }) => {
            let value = keyToPick || defaultValue
            if (key === 'initialValue') {
              if (component === 'checkbox') {
                value = keyToPick === true
              }
            }
            picked[id] = value
          }
        )
      })
    })
  }
  return picked
}

const pickItems = sections => {
  let items = []
  if (sections && sections.length) {
    sections.forEach(({ rows }) => {
      rows.forEach(row => {
        items = [...items, ...row.items]
      })
    })
  }
  return items
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

const getLabel = ({
  messages,
  formatMessage,
  labelI18nKey,
  label,
  formik,
  validation,
}) => {
  let text
  if (labelI18nKey) {
    text = formatMessage(
      messages[isFunction(labelI18nKey) ? labelI18nKey(formik) : labelI18nKey]
    )
  } else {
    text = isFunction(label) ? label(formik) : label
  }

  return buildLabel(text, validation)
}

const getFormattedString = (
  i18nKey,
  { messages, formatMessage, formik },
  defaultValue
) => {
  let text = defaultValue || ''
  if (i18nKey) {
    text = formatMessage(
      messages[isFunction(i18nKey) ? i18nKey(formik) : i18nKey]
    )
  }

  return text
}

const getBaseData = (data, formatMessage, messages) => {
  return data.map(({ externalId, i18nKey, name }) => ({
    value: externalId,
    label: formatMessage(messages[i18nKey], name),
  }))
}

const getFieldErrorProps = (formik, id) => ({
  error: formik.touched[id] && formik.errors[id]?.length > 0,
  helperText: formik.touched[id] && formik.errors[id],
})

const validationBase = {
  required: value => {
    return !value ? 'Required' : ''
  },
}

export {
  buildErrorMessage,
  buildLabel,
  createValidationSchema,
  getBaseData,
  getFieldErrorProps,
  getFormattedString,
  getInitialValuesFromFormConfig,
  getLabel,
  mergeFormConfigWithData,
  pickItems,
  pickKeys,
  validationBase,
}
