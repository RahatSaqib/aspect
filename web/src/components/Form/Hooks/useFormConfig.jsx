import { useCallback, useEffect, useState } from 'react'
import cloneDeep from 'lodash/cloneDeep'
import isArray from 'lodash/isArray'
import isEqual from 'lodash/isEqual'
import isEqualWith from 'lodash/isEqualWith'
import isPlainObject from 'lodash/isPlainObject'
import keys from 'lodash/keys'
import range from 'lodash/range'
import reduce from 'lodash/reduce'
import set from 'lodash/set'
import xor from 'lodash/xor'
import { getInitialValuesFromFormConfig, pickItems, pickKeys } from '../Formik/Helpers'

const getState = formConfig => {
  const { sections } = formConfig
  const initialValues = getInitialValuesFromFormConfig(formConfig)
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

const skipGuids = keys => keys.filter(key => key !== '__guid__')
const compareValuesSkipGuid = (obj1, obj2) => {
  const keys1 = skipGuids(keys(obj1))
  const keys2 = skipGuids(keys(obj2))
  if (keys1.length !== keys2.length || xor(keys1, keys2).length > 0) {
    return false
  }
  for (let j1 = 0; j1 < keys1.length; j1++) {
    const key = keys1[j1]
    const v1 = obj1[key]
    const v2 = obj2[key]
    if (isArray(v1)) {
      if (!isArray(v2) || v1.length !== v2.length) {
        return false
      }
      for (let k = 0; k < v1.length; k++) {
        if (!compareValuesSkipGuid(v1[k], v2[k])) {
          return false
        }
      }
    } else if (isPlainObject(v1)) {
      if (!isPlainObject(v2)) {
        return false
      }
      if (!compareValuesSkipGuid(v1, v2)) {
        return false
      }
    } else if (!isEqual(v1, v2)) {
      return false
    }
  }

  return true
}
export const useFormConfig = formConfig => {
  const [meta, setMeta] = useState(getState(formConfig))

  useEffect(() => {
    const currentState = getState(formConfig)
    if (!isEqualWith(meta.initialValues, currentState.initialValues, compareValuesSkipGuid)) {
      setMeta(currentState)
    }
  }, [formConfig, meta.initialValues])

  const registerVisibleFields = useCallback(
    (values, formik, isEditMode, touchedName) => {
      const { items = [] } = meta
      const validators = {}
      items.forEach(({ id, validate, validateIf, visibleIf, row }) => {
        const { isMulti, id: rowId } = row
        range(isMulti ? values[rowId].length : 1).forEach(subRowIndex => {
          const itemId = `${isMulti ? `${rowId}[${subRowIndex}].` : ''}${id}`
          formik.unregisterField(itemId)

          const isVisible = !visibleIf || visibleIf(values, isEditMode, subRowIndex)
          if (isVisible) {
            if (validateIf && !validateIf(values, formik, { subRowIndex, touchedName })) {
              validate = undefined
            }

            if (validate) {
              validators[itemId] = validate
            }
            formik.registerField(itemId, { validate })
          }
        })
      })
      return { validators }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  const updateField = useCallback(
    (fieldName, value, { formik, toggleEdit = true, isTouched = true }) => {
      /**
       * 1. set field 'touched' and do NOT run validation (3rd param is 'false')
       */
      formik.setFieldTouched(fieldName, isTouched, false)
      /**
       * 2. set new value to the field and do NOT run validation (3rd param is 'false')
       */
      formik.setFieldValue(fieldName, value, false)
      /**
       * 3. assemble latest set of `values`
       * (formik.values is not yet up-to-date because it is updated asynchronously by formik engine)
       */
      const values = cloneDeep(formik.values)
      set(values, fieldName, value)
      /**
       * 4. address func onAfterChange if defined for item
       */
      const { items = [] } = meta
      const { onAfterChange } = items.find(({ id }) => id === fieldName) || {}
      if (onAfterChange) {
        onAfterChange(formik)
      }
      /**
       * 5. refresh visibility of all fields and register validators of only visible fields
       */
      registerVisibleFields(values, formik, toggleEdit, fieldName)
      /**
       * 6. validate form for current set of `values` for all visible fields
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
