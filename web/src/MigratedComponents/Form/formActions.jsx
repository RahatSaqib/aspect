/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react'
import classnames from 'classnames/bind'
import Button from '@material-ui/core/Button'
import { useSelector } from 'react-redux'
import isFunction from 'lodash/isFunction'

import { useFormikState } from './Formik/Context'

const cssClasses = classnames.bind(require('./Form.css'))

const FormActionButton = ({ formik, action, onClick, isVisible }) => {
  return formik ? (
    <Button
      variant="contained"
      color={action.id === 'cancel' ? 'default' : 'primary'}
      onClick={() =>
        isFunction(action.onClick) ? action.onClick() : onClick(action.id)
      }
      className={cssClasses('form__button', `form__button--${action.id}`, {
        'form__button--enabled': isVisible,
        'form__button--disabled': !isVisible,
      })}
    >
      {action.text}
    </Button>
  ) : null
}

const getDefaultDisplayState = defaultAction => {
  const keys = ['edit', 'cancel', 'save']
  return keys.reduce((acc, curr) => {
    acc[curr] = curr === defaultAction || false
    return acc
  }, {})
}

const FormActions = ({ config }) => {
  const permissions = useSelector(({ user }) => user.jwt.permissions)
  const { actions } = config
  const { items: formActions, default: defaultAction } = actions
  const { formik, toggleEdit, setToggleEdit } = useFormikState()
  const [displayConfig, setDisplayConfig] = useState(
    getDefaultDisplayState(defaultAction)
  )
  const [actionToAction, setActionToAction] = useState(false)

  useEffect(() => {
    if (actionToAction) {
      switch (actionToAction) {
        case 'edit':
          setToggleEdit(true)
          break
        case 'cancel':
          setToggleEdit(false)
          formik.resetForm()
          break
        case 'save':
          formik.handleSubmit()
          setToggleEdit(false)
          break

        default:
          break
      }
    }
  }, [actionToAction])

  useEffect(() => {
    if (toggleEdit) {
      setDisplayConfig({ edit: false, cancel: true, save: true })
    } else {
      setDisplayConfig(getDefaultDisplayState(defaultAction))
    }
  }, [toggleEdit])

  return (
    formActions &&
    formActions.map(action => (
      <FormActionButton
        formik={formik}
        action={action}
        onClick={setActionToAction}
        isVisible={
          isFunction(action.isVisible)
            ? action.isVisible(permissions, toggleEdit)
            : displayConfig[action.id]
        }
      />
    ))
  )
}

export default FormActions
