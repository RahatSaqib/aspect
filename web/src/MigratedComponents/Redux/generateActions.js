export default function generateActions(prefix, action) {
  return {
    REQUEST: `${prefix}_${action}_REQUEST`,
    SUCCESS: `${prefix}_${action}_SUCCESS`,
    FAILURE: `${prefix}_${action}_FAILURE`,
  }
}
