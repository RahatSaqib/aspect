// ADR: this class is not compliant with RFC 7807 Problem-Details, as the RFC does not contemplate multiple errors, except
// for the case of exntending the problem object. RFC 7807 should be reconsidered for eventual public APIs.
module.exports = class Problem {
  /**
   * Holds a collection of problems information about failing bussiness rules,
   * in a format that client code can handle to communicate in the rigth way to the user.
   * @param {string} errorKeyCode - Translation key, should be declared in customErrorNotifications variable in fetch call.
   * @param {Object} values - Not in use, value or array of values to replace in template placeholders.
   */
  constructor(errorKeyCode, values) {
    this.problems = {}
    if (errorKeyCode) {
      this.addProblem(errorKeyCode, values)
    }
  }

  /**
   * Add a problem to the collection.
   * @param {string} errorKeyCode - Translation key, should be declared in customErrorNotifications variable in fetch call.
   * @param {Object} values - Not in use, value or array of values to replace in template placeholders.
   * @returns - Problem instance
   */
  addProblem = (errorKeyCode, values) => {
    this.problems[errorKeyCode] = values || {}
    return this
  }

  get hasProblems() {
    return Object.keys(this.problems).length > 0
  }
}
