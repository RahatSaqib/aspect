/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react'
import classnames from 'classnames/bind'
import Button from '@material-ui/core/Button'
import isFunction from 'lodash/isFunction'
import { useFormikContext } from 'formik'

import { useAuthState } from '../../Providers/AuthProvider'

import styles from './Form.css'

const cssClasses = classnames.bind(styles)

const FormActionButton = ({ formik, action, onClick, isVisible }) => {
  return formik ? (
    <Button
      className={cssClasses('form__button', `form__button--${action.id}`, {
        'form__button--enabled': isVisible,
        'form__button--disabled': !isVisible,
      })}
      color={action.id === 'cancel' ? 'default' : 'primary'}
      disabled={!formik.isValid}
      onClick={() =>
        isFunction(action.onClick) ? action.onClick() : onClick(action.id)
      }
      variant="contained"
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

const FormActions = ({ config, onSubmit }) => {
  const {
    jwt: { permissions },
  } = useAuthState()
  const { actions } = config
  const { items: formActions, default: defaultAction } = actions
  const { formik, toggleEdit, setToggleEdit, meta } = useFormikContext()
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
          if (onSubmit) {
            onSubmit(formik, meta)
          } else {
            formik.handleSubmit()
          }
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
    formActions.map((action, actionIndex) => (
      <FormActionButton
        key={`action-${actionIndex.toString()}`}
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
