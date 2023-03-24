import React, { useRef } from 'react'
import { FormControl } from '@mui/material'
import classnames from 'classnames/bind'
import { useFormikContext } from 'formik'
import PropTypes from 'prop-types'
import PlaceholderSelector from '../../Placeholders/PlaceholderSelector'
import styles from '../Form.css'
import AspectTextField from './TextField'

const cssClasses = classnames.bind(styles)

const PlaceholderTextField = props => {
  const { formik, id: fieldName } = props
  const inputRef = useRef()
  const { updateField, toggleEdit } = useFormikContext()

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

    updateField(fieldName, value, { formik, toggleEdit })

    setTimeout(() => {
      inputRef.current.focus()
      inputRef.current.selectionStart = selectionStart + placeholder.length
      inputRef.current.selectionEnd = inputRef.current.selectionStart
    })
  }

  const filter = { type: formik.values.notificationType, assay: formik.values.result[0].assayId }

  return (
    <FormControl className={cssClasses('form_FormControl')}>
      <AspectTextField {...props} inputRef={inputRef} />
      <PlaceholderSelector onClose={onClosePlaceholderSelector} onSelect={onSelectPlaceholder} filter={filter} />
    </FormControl>
  )
}

PlaceholderTextField.propTypes = {
  formik: PropTypes.oneOfType([PropTypes.object]).isRequired,
  id: PropTypes.string.isRequired,
}

export default PlaceholderTextField
