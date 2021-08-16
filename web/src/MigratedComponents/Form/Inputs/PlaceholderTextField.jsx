import React, { useState, useRef } from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames/bind'
import FormControl from '@material-ui/core/FormControl'

import { useFormikState } from '../Formik/Context'
import {
  insertPlaceholder,
  PlaceholderSelector,
  PlaceholderContextMenu,
} from '../../Placeholders'
import AspectTextField from './TextField'

import styles from '../Form.css'

const cssClasses = classnames.bind(styles)

const PlaceholderTextField = props => {
  const { formik, id: fieldName } = props
  const [contextMenu, setContextMenu] = useState(null)
  const inputRef = useRef()
  const { updateField } = useFormikState()

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
      fieldName,
      formik,
      inputRef,
      onCloseContextMenu,
      placeholderId,
      updateField,
    })
  }

  return (
    <FormControl className={cssClasses('form_FormControl')}>
      <AspectTextField
        {...props}
        inputRef={inputRef}
        onContextMenu={onContextMenu}
      />
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
    </FormControl>
  )
}

PlaceholderTextField.propTypes = {
  formik: PropTypes.oneOfType([PropTypes.object]).isRequired,
  id: PropTypes.string.isRequired,
}

export default PlaceholderTextField
