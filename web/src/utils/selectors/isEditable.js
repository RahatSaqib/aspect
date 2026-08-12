export default function isEditable(user, module) {
  const permissions = user?.jwt?.permissions ?? []
  return permissions.includes(`${module}:edit`) || permissions.includes(`${module}:admin`)
}
