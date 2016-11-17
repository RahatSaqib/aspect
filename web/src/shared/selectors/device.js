const isEditable = function (user/* TODO: add me back, device */) {
  const editable = user.name === 'admin'
  // TODO: is user has write access to the object?

  return editable
}

export { isEditable as default }
