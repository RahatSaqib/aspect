export default function isEditable(user, module) {
  const notEditable = user.jwt.permissions
    .intersect([`${module}:admin`, `${module}:admin`])
    .isEmpty()

  return !notEditable
}
