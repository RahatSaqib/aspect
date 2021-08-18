import React, { Fragment, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

import useI18n from '../../../Hooks/i18n/useI18n'
import Create from './Create'
import Update from './Update'
import editActions from '../Forms/editConfig'

const AspectResultDetail = () => {
  const { resultId } = useParams()
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

export default AspectResultDetail
