import { useCallback, useState } from 'react'
import reduce from 'lodash/reduce'

import { pickItems, pickKeys } from '../Formik/Helpers/index'

const getState = formConfig => {
  const { sections } = formConfig
  const initialValues = pickKeys(sections, 'initialValue', '')
  const fieldTypes = pickKeys(sections, 'type')
  const items = pickItems(sections)
  const byId = reduce(
    items,
    (acc, item) => {
      acc[item.id] = item
      return acc
    },
    {}
  )
  const validators = reduce(
    items,
    (acc, { id, validate }) => {
      if (validate) {
        acc[id] = validate
      }
      return acc
    },
    {}
  )

  return {
    byId,
    fieldTypes,
    initialValues,
    items,
    validators,
  }
}
export const useFormConfig = formConfig => {
  const [meta] = useState(getState(formConfig))

  const registerVisibleFields = useCallback((values, formik) => {
    const { items = [] } = meta
    const validators = {}
    items.forEach(({ id, validate, visibleIf }) => {
      formik.unregisterField(id)

      const isVisible = !visibleIf || visibleIf(values)
      if (isVisible) {
        if (validate) {
          validators[id] = validate
        }
        formik.registerField(id, { validate })
      }
    })
    return { validators }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const updateField = useCallback(
    (fieldName, value, formik, isTouched = true) => {
      /**
       * 1. set field 'touched' and do NOT run validation (3rd param is 'false')
       */
      formik.setFieldTouched(fieldName, isTouched, false)
      /**
       * 1. set new value to the field and do NOT run validation (3rd param is 'false')
       */
      formik.setFieldValue(fieldName, value, false)
      /**
       * 2. assemble latest set of `values`
       * (formik.values is not yet up-to-date because it is updated asynchronously by formik engine)
       */
      const values = {
        ...formik.values,
        [fieldName]: value,
      }
      /**
       * 3. refresh visibility of all fields and register validators of only visible fields
       */
      registerVisibleFields(values, formik)
      /**
       * 4. validate form for current set of `values` for all visible fields
       */
      formik.validateForm(values)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  return {
    meta,
    registerVisibleFields,
    updateField,
  }
}

export default useFormConfig
