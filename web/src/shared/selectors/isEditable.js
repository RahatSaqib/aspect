export default function isEditable(user, module) {
  const notEditable = user.jwt.permissions
    .intersect([`${module}:edit`])
    .isEmpty()

  return !notEditable
}
