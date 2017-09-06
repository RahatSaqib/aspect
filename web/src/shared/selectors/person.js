export function isEditable(
  user
  /* TODO: Add this back when permissions have been fleshed out, person */
) {
  // TODO: Check if the user has the necessary permissions to edit THIS PARTICULAR person?
  return (
    user.jwt.permissions.includes('person:admin') ||
    user.jwt.permissions.includes('person:edit')
  )
}

export { isEditable as default }
