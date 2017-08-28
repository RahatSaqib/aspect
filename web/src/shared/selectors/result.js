export function isEditable(user /* TODO: add me back, result */) {
  const notEditable = user.jwt.permissions
    .intersect(['result:admin', 'result:edit'])
    .isEmpty()

  return !notEditable
}

export { isEditable as default }
