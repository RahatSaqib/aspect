export function isEditable(user/* TODO: add me back, site */) {
  const editable = user.name === 'admin'
  // TODO: is user has write access to the object?

  return editable
}
