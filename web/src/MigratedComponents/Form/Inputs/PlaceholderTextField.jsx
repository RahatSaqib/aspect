import React, { useState, useRef } from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames/bind'
import FormControl from '@material-ui/core/FormControl'
import { useFormikContext } from 'formik'

import PlaceholderSelector from '../../Placeholders/PlaceholderSelector'
import PlaceholderContextMenu from '../../Placeholders/PlaceholderContextMenu'
import AspectTextField from './TextField'

import styles from '../Form.css'

const cssClasses = classnames.bind(styles)

const PlaceholderTextField = props => {
  const { formik, id: fieldName } = props
  const [contextMenu, setContextMenu] = useState(null)
  const inputRef = useRef()
  const { updateField } = useFormikContext()

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
    let value = formik.values[fieldName]
    const placeholder = `{{${placeholderId}}}`
    const { selectionStart, selectionEnd } = inputRef.current

    const txtStart = value.substring(0, selectionStart)
    const txtEnd = value.substring(selectionEnd, value.length)
    value = `${txtStart}${placeholder}${txtEnd}`

    updateField(fieldName, value, formik)

    onCloseContextMenu()

    setTimeout(() => {
      inputRef.current.focus()
      inputRef.current.selectionStart = selectionStart + placeholder.length
      inputRef.current.selectionEnd = inputRef.current.selectionStart
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
