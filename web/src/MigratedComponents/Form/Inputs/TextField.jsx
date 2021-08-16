import React, { useState, useRef } from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames/bind'
import FormControl from '@material-ui/core/FormControl'
import TextField from '@material-ui/core/TextField'

import isNil from 'lodash/isNil'
import omitBy from 'lodash/omitBy'

import FormHTMLLabel from '../FormHTMLLabel'
import { getFieldErrorProps } from '../Formik/Helpers'
import { useFormikState } from '../Formik/Context'
import {
  insertPlaceholder,
  PlaceholderSelector,
  PlaceholderContextMenu,
} from '../../Placeholders'

import styles from '../Form.css'

const cssClasses = classnames.bind(styles)

const AspectTextField = ({
  controlType: { rowsMax, rows } = {},
  enablePlaceholders,
  formik,
  label,
  link,
  multiline,
  /**
   * below props are not used - need then to free `rest`
   */
  classNames,
  validate,
  ...rest
}) => {
  const [contextMenu, setContextMenu] = useState(null)
  const inputRef = useRef()
  const { updateField } = useFormikState()

  const mergedProps = multiline
    ? {
        ...rest,
        ...omitBy({ maxRows: rowsMax, minRows: rows }, v => isNil(v)),
        label,
        multiline,
      }
    : {
        ...rest,
        label: link ? <FormHTMLLabel label={label} link={link} /> : label,
      }

  const onChangeLocal = event => {
    updateField(rest.id, event.target.value, formik)
  }

  const onContextMenu = event => {
    event.preventDefault()
    setContextMenu(
      contextMenu === null
        ? {
            mouseX: event.clientX - 2,
            mouseY: event.clientY - 4,
          }
        : null
    )
  }

  const onCloseContextMenu = () => {
    setContextMenu(null)
  }

  const onClosePlaceholderSelector = () => {
    setTimeout(() => inputRef.current.focus())
  }

  const onSelectPlaceholder = placeholderId => {
    insertPlaceholder({
      fieldName: rest.id,
      formik,
      inputRef,
      onCloseContextMenu,
      placeholderId,
      updateField,
    })
  }

  return (
    <FormControl className={cssClasses('form_FormControl')}>
      <TextField
        {...mergedProps}
        inputRef={inputRef}
        onChange={onChangeLocal}
        onContextMenu={onContextMenu}
        {...getFieldErrorProps(formik, rest.id)}
      />
      {enablePlaceholders ? (
        <>
          <PlaceholderContextMenu
            open={contextMenu !== null}
            onClose={onCloseContextMenu}
            onSelect={onSelectPlaceholder}
            position={
              contextMenu !== null
                ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
                : undefined
            }
          />

          <PlaceholderSelector
            onClose={onClosePlaceholderSelector}
            onSelect={onSelectPlaceholder}
          />
        </>
      ) : null}
    </FormControl>
  )
}

AspectTextField.defaultProps = {
  classNames: null,
  enablePlaceholders: false,
  link: false,
  multiline: false,
  validate: null,
}

AspectTextField.propTypes = {
  controlType: PropTypes.oneOfType([PropTypes.object]).isRequired,
  enablePlaceholders: PropTypes.bool,
  formik: PropTypes.oneOfType([PropTypes.object]).isRequired,
  label: PropTypes.oneOfType([PropTypes.object, PropTypes.string]).isRequired,
  link: PropTypes.oneOfType([PropTypes.object, PropTypes.bool]),
  multiline: PropTypes.bool,
  /**
   * below props are not used - need them to free `rest`
   */
  classNames: PropTypes.oneOfType([PropTypes.object]),
  validate: PropTypes.func,
}

export default AspectTextField
