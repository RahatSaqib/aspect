const isEditable = function (user/* TODO: add me back, result */) {
  const editable = user.name === 'admin'

  // TODO: does user have write access to the object?
  return editable
}

export { isEditable as default }
