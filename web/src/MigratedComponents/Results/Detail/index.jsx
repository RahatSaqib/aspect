import React, { Fragment, useEffect, useState } from 'react'
import PropTypes from 'prop-types'

import useI18n from '../../../Hooks/i18n/useI18n'
import Create from './Create'
import Update from './Update'
import editActions from '../Forms/editConfig'

const AspectResultDetail = ({ match }) => {
  const { params } = match
  const { resultId } = params
  const { formatMessage } = useI18n()
  const [schema, setSchema] = useState(false)

  useEffect(() => {
    if (!schema) {
      const formSchema = resultId === 'add' ? null : editActions(formatMessage)
      setSchema(formSchema)
    }
  }, [schema, formatMessage, resultId])

  return schema ? (
    <Fragment>
      {resultId === 'add' ? <Create formSchema={schema} /> : null}
      {resultId !== 'add' && schema ? (
        <Update formSchema={schema} resultId={+resultId} />
      ) : null}
    </Fragment>
  ) : null
}

AspectResultDetail.propTypes = {
  match: PropTypes.oneOfType([PropTypes.object]).isRequired,
}

export default AspectResultDetail
