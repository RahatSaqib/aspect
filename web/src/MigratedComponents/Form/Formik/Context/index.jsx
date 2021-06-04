import React, { useEffect, useState } from 'react'

import { useFormik } from 'formik'
import omitBy from 'lodash/omitBy'
import pick from 'lodash/pick'
import keys from 'lodash/keys'

import DisplayFormikState from '../Helpers/debug'
import useFormConfig from '../../Hooks/useFormConfig'

const FormikContext = React.createContext()

const FormikProvider = ({ config, children }) => {
  const debug = false
  const { actions } = config
  const [toggleEdit, setToggleEdit] = useState(actions.default === 'save')
  const { meta, registerVisibleFields, updateField } = useFormConfig(config)
  const { fieldTypes, initialValues } = meta

  const formik = useFormik({
    enableReinitialize: true,
    initialValues,
    validateOnMount: false,
    onSubmit: values =>
      // eslint-disable-next-line no-console
      console.log(
        JSON.stringify(
          pick(values, keys(omitBy(fieldTypes, i => i === 'readOnly'))),
          null,
          2
        )
      ),
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
    <FormikContext.Provider
      value={{
        formik,
        setToggleEdit,
        toggleEdit,
        updateField,
      }}
    >
      {children}
      {debug && <DisplayFormikState {...formik} />}
    </FormikContext.Provider>
  )
}

function useFormikState() {
  const context = React.useContext(FormikContext)
  if (context === undefined) {
    throw new Error('useFormikState must be used within a FormikProvider')
  }
  return context
}

export { FormikContext, FormikProvider, useFormikState }
