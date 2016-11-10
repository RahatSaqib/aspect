export function isEditable(user/* TODO: add me back, device */) {
  const notEditable = user
    .permissions
    .toSet()
    .intersect(['device:admin', 'device:edit'])
    .isEmpty()

  return !notEditable
}
