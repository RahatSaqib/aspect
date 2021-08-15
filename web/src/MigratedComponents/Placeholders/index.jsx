import Selector from './PlaceholderSelector'
import ContextMenu from './PlaceholderContextMenu'

export const PlaceholderSelector = Selector

export const PlaceholderContextMenu = ContextMenu

export const insertPlaceholder = ({
  inputRef,
  placeholderId,
  formik,
  fieldName,
  updateField,
  onCloseContextMenu,
}) => {
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

export default {
  PlaceholderSelector,
  PlaceholderContextMenu,
  insertPlaceholder,
}
