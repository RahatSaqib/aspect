import { isImmutable } from 'immutable'

export default function isEditable(user, module) {
  return isImmutable(user)
    ? !user.jwt.permissions.intersect([`${module}:edit`]).isEmpty()
    : user.jwt.permissions.includes(`${module}:edit`)
}
