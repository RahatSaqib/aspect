export function isEditable(user/* TODO: add me back, result */) {
  const notEditable = user
    .permissions
    .toSet()
    .intersect(['result:admin', 'result:edit'])
    .isEmpty()

  return !notEditable
}
