import React, { useEffect, useState } from 'react'
import cloneDeep from 'lodash/cloneDeep'
import isArray from 'lodash/isArray'
import isPlainObject from 'lodash/isPlainObject'
import keys from 'lodash/keys'
import omit from 'lodash/omit'

import { FormikProvider as FormikProviderBase, useFormik } from 'formik'

import DisplayFormikState from '../Helpers/debug'
import useFormConfig from '../../Hooks/useFormConfig'

export const FormikProvider = ({ config, children }) => {
  const debug = false
  const { actions } = config
  const [toggleEdit, setToggleEdit] = useState(actions.default === 'save')
  const { meta, registerVisibleFields, updateField } = useFormConfig(config)
  const { fieldTypes, initialValues } = meta

  const formik = useFormik({
    enableReinitialize: true,
    initialValues,
    validateOnMount: false,
    onSubmit: values => {
      /**
       * prepare payload, i.e.
       * - remove props which are read only
       * - remove prop `__guid__` from array of objects
       */
      const payload = cloneDeep(values)
      keys(payload).forEach(key => {
        if (fieldTypes[key] === 'readOnly') {
          delete payload[key]
        } else if (isArray(payload[key])) {
          payload[key] = payload[key].map(it =>
            isPlainObject(it) ? omit(it, ['__guid__']) : it
          )
        }
      })

      // eslint-disable-next-line no-console
      console.log(JSON.stringify(payload, null, 2))
    },
  })

  useEffect(() => {
    /**
     * 1. based on initial values:
     *    - define all visible fields and
     *    - register in formik all visible fields with validators
     */
    registerVisibleFields(initialValues, formik)
    /**
     * 2. validate form to populate formik.errors
     */
    formik.validateForm()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <FormikProviderBase
      value={{
        ...formik, // provide formikProps in the root (i.e. FieldArray needs setFormikState)
        formik,
        setToggleEdit,
        toggleEdit,
        updateField,
      }}
    >
      {children}
      {debug && <DisplayFormikState {...formik} />}
    </FormikProviderBase>
  )
}

export default FormikProvider
