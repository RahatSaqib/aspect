// The generated device name is `identifier [customNamePart] [suffix]`; preview an edit by
// swapping the stored part (right after the identifier, the first space-delimited token)
// for the edited one.
export const previewDeviceName = ({ currentName, currentPart, editedPart }) => {
  const name = currentName || ''
  const identifier = name.split(' ')[0]
  let rest = name.slice(identifier.length)
  const storedPart = String(currentPart || '').trim()
  if (storedPart && rest.startsWith(` ${storedPart}`)) {
    rest = rest.slice(storedPart.length + 1)
  }
  const part = String(editedPart || '').trim()
  return `${identifier}${part ? ` ${part}` : ''}${rest}`
}
