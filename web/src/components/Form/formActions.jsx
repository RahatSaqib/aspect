/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react'
import Button from '@mui/material/Button'
import classnames from 'classnames/bind'
import { useFormikContext } from 'formik'
import isFunction from 'lodash/isFunction'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthState } from '../../providers/AuthProvider'
import { getReturnUrl, useUrlQuery } from '../AspectTable/Helpers'
import styles from './Form.css'

const cssClasses = classnames.bind(styles)

const FormActionButton = ({ formik, action, onClick, isVisible }) => {
  return formik ? (
    <Button
      className={cssClasses('form__button', `form__button--${action.id}`, {
        'form__button--invisible': !isVisible,
      })}
      disabled={action.id === 'save' && (!formik.isValid || !formik.dirty)}
      onClick={() => (isFunction(action.onClick) ? action.onClick() : onClick(action))}
      variant={action.ui?.variant || 'contained'}
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
  const navigate = useNavigate()
  const { search } = useLocation()
  const query = useUrlQuery(search)
  const {
    jwt: { permissions },
  } = useAuthState()
  const { actions } = config
  const { items: formActions, default: defaultAction } = actions
  const { formik, toggleEdit, setToggleEdit, meta } = useFormikContext()
  const [displayConfig, setDisplayConfig] = useState(getDefaultDisplayState(defaultAction))
  const [currentAction, setCurrentAction] = useState(false)

  useEffect(() => {
    if (currentAction) {
      switch (currentAction.id) {
        case 'edit':
          setToggleEdit(true)
          break
        case 'cancel': {
          const { returnUrl } = currentAction
          if (returnUrl) {
            const path = getReturnUrl(query.get('returnUrl'), returnUrl)
            navigate(path)
          } else {
            setToggleEdit(false)
            formik.resetForm()
          }
          break
        }
        case 'save':
          if (onSubmit) {
            onSubmit(formik, meta)
          } else {
            formik.handleSubmit()
            setToggleEdit(false)
          }
          break

        case 'back': {
          const { returnUrl } = currentAction
          if (returnUrl) {
            const path = getReturnUrl(query.get('returnUrl'), returnUrl)
            navigate(path)
          }
          break
        }
        default:
          break
      }
    }
  }, [currentAction])

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
        onClick={setCurrentAction}
        isVisible={isFunction(action.isVisible) ? action.isVisible(permissions, toggleEdit) : displayConfig[action.id]}
      />
    ))
  )
}

export default FormActions
