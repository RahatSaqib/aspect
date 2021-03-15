import React, { Fragment } from 'react'
import PropTypes from 'prop-types'
import Create from './Create'
import Update from './Update'
import editActions from '../Forms/editConfig'

const AspectResultDetail = ({ match }) => {
  const { params } = match
  const { resultId } = params
  const formSchema = resultId === 'add' ? null : editActions
  return formSchema ? (
    <Fragment>
      {resultId === 'add' ? <Create formSchema={formSchema} /> : null}
      {resultId !== 'add' && formSchema ? (
        <Update formSchema={formSchema} resultId={resultId} />
      ) : null}
    </Fragment>
  ) : null
}

AspectResultDetail.propTypes = {
  match: PropTypes.oneOfType([PropTypes.object]).isRequired,
}

export default AspectResultDetail
