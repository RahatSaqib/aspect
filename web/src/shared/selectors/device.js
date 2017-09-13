export function isEditable(user /* TODO: add me back, device */) {
  const notEditable = user.jwt.permissions
    .intersect(['device:admin', 'device:edit'])
    .isEmpty()

  return !notEditable
}

export { isEditable as default }
