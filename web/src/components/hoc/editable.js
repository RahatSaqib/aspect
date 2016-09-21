// Imports from packages
import { connect } from 'react-redux'

function mapStateToProps(state) {
  const editable = state.user.name === 'admin'
  // TODO: is user has write access to the object?

  return {
    editable
  }
}

export const injectEditable = connect(mapStateToProps)
