import { isImmutable, Set } from 'immutable'

export default function isEditable(user, module) {
  const permissions = new Set(user.jwt.permissions)
  return isImmutable(user)
    ? !permissions.intersect([`${module}:edit`, `${module}:admin`]).isEmpty()
    : permissions.includes(`${module}:edit`) ||
        permissions.includes(`${module}:admin`)
}
