import * as Yup from 'yup'

import cloneDeep from 'lodash/cloneDeep'
import flatten from 'lodash/flatten'
import get from 'lodash/get'
import isArray from 'lodash/isArray'
import isBoolean from 'lodash/isBoolean'
import isEmpty from 'lodash/isEmpty'
import isFunction from 'lodash/isFunction'
import isPlainObject from 'lodash/isPlainObject'
import range from 'lodash/range'
import set from 'lodash/set'
import uniqueId from 'lodash/uniqueId'

import { isUrl } from '../../../../shared/utils/validate'
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
                url: curr.link.url.replace(`:${curr.link.key}`, get(data, curr.link.key)),
              }
            : null
          return acc
        }, [])
      )
    )
  }
  return configToMutate
}

const getInitialValuesFromFormConfig = (config, savedValues) => {
  const initialValues = {}
  const { sections } = config
  sections.forEach(({ rows }) => {
    rows.forEach(row => {
      const { items, isMulti, id: rowId, presetInitialValues } = row
      if (presetInitialValues) {
        presetInitialValues(initialValues)
      }

      // multiply rows if saved value is available
      if (isMulti) {
        initialValues[rowId] = initialValues[rowId] || []
        const subRowsInitial = initialValues[rowId]
        // having saved sub-rows
        if (savedValues && isPlainObject(savedValues) && isArray(savedValues[rowId])) {
          const subRowsSaved = savedValues[rowId]
          subRowsSaved.forEach((subRow, subRowIndex) => {
            subRowsInitial[subRowIndex] = subRowsInitial[subRowIndex] || {
              __guid__: uniqueId(rowId),
            }

            items.forEach(({ controlType = {}, id: fieldName, initialValue }) => {
              const { component } = controlType
              const savedValue = get(subRow, fieldName)
              let value
              if (component === 'checkbox') {
                value = isBoolean(savedValue) ? savedValue : initialValue === true
              } else {
                value = savedValue || initialValue || ''
              }
              set(subRowsInitial[subRowIndex], fieldName, value)
            })
          })
        } else {
          subRowsInitial[0] = subRowsInitial[0] || {
            __guid__: uniqueId(rowId),
          }
          items.forEach(({ controlType = {}, id: fieldName, initialValue }) => {
            const { component } = controlType
            let value = initialValue || ''
            if (component === 'checkbox') {
              value = initialValue === true
            }
            set(subRowsInitial[0], fieldName, value)
          })
        }
      } else {
        items.forEach(({ controlType = {}, id: fieldName, initialValue }) => {
          const { component } = controlType
          const savedValue = savedValues ? get(savedValues, fieldName) : null
          let value
          if (component === 'checkbox') {
            value = isBoolean(savedValue) ? savedValue : initialValue === true
          } else {
            value = savedValue || initialValue || ''
          }
          set(initialValues, fieldName, value)
        })
      }
    })
  })

  return initialValues
}

const pickKeys = (sections, key, defaultValue) => {
  const picked = {}
  if (sections && sections.length) {
    flatten(sections.map(({ rows }) => flatten(rows.map(row => row.items)))).forEach(
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
  }
  return picked
}

const pickItems = sections => {
  let items = []
  if (sections && sections.length) {
    items = flatten(
      sections.map(({ rows }) =>
        flatten(
          rows.map(row =>
            row.items.map(item =>
              /**
               * add 'row' prop to 'item' to be able to handle
               * items in multiplied rows
               */
              ({ ...item, row })
            )
          )
        )
      )
    )
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
              ...[constraint, intlFormatMessage(messages[messageId], { total: constraint })].filter(p => p)
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
    validation && validation.length ? validation.filter(item => item.type === 'required').length > 0 : false
  return `${label} ${isrequired ? '*' : ''}`
}

const getLabel = ({ messages, formatMessage, labelI18nKey, label, formik, validation }) => {
  let text
  if (labelI18nKey) {
    text = formatMessage(messages[isFunction(labelI18nKey) ? labelI18nKey(formik) : labelI18nKey])
  } else {
    text = isFunction(label) ? label(formik) : label
  }

  return buildLabel(text, validation)
}

const getFormattedString = (i18nKey, { messages, formatMessage, formik }, defaultValue) => {
  let text = defaultValue || ''
  if (i18nKey) {
    text = formatMessage(messages[isFunction(i18nKey) ? i18nKey(formik) : i18nKey])
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
  error: get(formik.touched, id) && get(formik.errors, id)?.length > 0,
  helperText: get(formik.touched, id) && get(formik.errors, id),
})

const getBaseValidation = (formatMessage, messages) => {
  const requiredBase = (value, i18nKey) => (value ? '' : formatMessage(messages[i18nKey]))

  return {
    required: value => requiredBase(value, 'required'),
    checked: requiredBase,
    requiredLimitLength: (value, maxLength, i18nLimitLength) => {
      if (!value) return formatMessage(messages.required)
      return value.length > maxLength ? formatMessage(messages[i18nLimitLength]) : ''
    },
    requiredValidUrl: value => {
      if (!value) return formatMessage(messages.required)
      return isUrl(value) ? '' : formatMessage(messages.webUrlInvalid)
    },
  }
}

const getVisibleRows = (rows, values, toggleEdit) => {
  return rows.map(row => {
    if (row.visibleIf && !row.visibleIf(values, toggleEdit)) {
      // row is hidden explicitly
      return false
    }
    // row is visible if at least one item is visible
    const { isMulti, id: rowId } = row
    const itemsVisible = row.items.map(({ visibleIf }) =>
      range(isMulti ? values[rowId].length : 1)
        .map(subRowIndex => (visibleIf ? visibleIf(values, toggleEdit, subRowIndex) : true))
        .includes(true)
    )
    return itemsVisible.includes(true)
  })
}

const sanitizeFormValues = (values, { formConfig, removeReadOnly = true }) => {
  /**
   * loop through all sections/rows/items the same way as we do when rendering form
   * and get only values for visible items.
   * If we need to submit some of readonly or invisible fields, then do add them to
   * final payload after running this function. FOr instance - see func `onSubmit`
   * in `web/src/MigratedComponents/Notifications/Detail/index.jsx` where we append
   * `notificationType` (which is readonly) and especially `jobFunctions` array.
   */
  const toggleEdit = true
  const payload = {}
  const { sections } = formConfig
  sections.forEach(({ rows, visibleIf }) => {
    // section is hidden
    if (visibleIf && !visibleIf(values, toggleEdit)) {
      return null
    }
    const visibleRows = getVisibleRows(rows, values, toggleEdit)
    rows.forEach((row, rowIndex) => {
      if (visibleRows[rowIndex] === true) {
        const { items, isMulti } = row
        if (isMulti) {
          const subRows = values[row.id]
          subRows.forEach((_, subRowIndex) => {
            // loop items in sub-row
            items.forEach(({ type, id, visibleIf }) => {
              if (type === 'readOnly' && removeReadOnly) return
              // item is hidden
              if (visibleIf && !visibleIf(values, toggleEdit, subRowIndex)) {
                return
              }
              const itemId = `${row.id}[${subRowIndex}].${id}`
              set(payload, itemId, get(values, itemId))
            })
          })
        } else {
          items.forEach(({ type, id, visibleIf }) => {
            if (type === 'readOnly' && removeReadOnly) return
            // item is hidden
            if (visibleIf && !visibleIf(values, toggleEdit)) {
              return
            }
            set(payload, id, get(values, id))
          })
        }
      }
    })
  })

  return payload
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
  getBaseValidation,
  sanitizeFormValues,
  getVisibleRows,
}
