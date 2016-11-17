export function isEditable(user/* TODO: add me back, device */) {
  const notEditable = user
    .permissions
    .intersect(['device:admin', 'device:edit'])
    .isEmpty()

  return !notEditable
}

export { isEditable as default }
