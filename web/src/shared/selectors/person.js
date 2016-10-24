export function isEditable(user/*TODO: Add this back when permissions have been fleshed out, person*/) {
  //TODO: Check if the user has the necessary permissions to edit THIS PARTICULAR person?
  return user.permissions.has('person:admin') || user.permissions.has('person:edit')
}
