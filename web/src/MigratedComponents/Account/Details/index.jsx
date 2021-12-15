import React, { useState, useEffect, useMemo } from 'react'
import { useSelector } from 'react-redux'
import { useQuery } from 'react-query'
import { useParams } from 'react-router-dom'
import isEqual from 'lodash/isEqual'
import isEmpty from 'lodash/isEmpty'
import cloneDeep from 'lodash/cloneDeep'
import itemsConfig from './config'
import fetchWrapperForQueries from '../../QueryFetch'
import AspectPureFormik from '../../Form/PureFormik'
import { getInitialValues } from '../../Form/PureFormik/Helpers'

const ContactDetailsFormFormik = () => {
  const { personId } = useParams()
  const editor = useSelector(({ user }) => user.toJS())
  const [config, setConfig] = useState(false)
  const formItemsConfig = itemsConfig(editor)

  const { isLoading, isError, data, error } = useQuery(
    [`get-user-${personId}`, personId],
    async () =>
      fetchWrapperForQueries({
        endpoint: `/person/${personId}`,
      }),
    { enabled: !!personId && Number.isInteger(personId) }
  )

  if (isError) {
    throw new Error(error)
  }

  const items = useMemo(
    () => [
      formItemsConfig.row0,
      formItemsConfig.row1,
      formItemsConfig.row2,
      formItemsConfig.row3,
      formItemsConfig.row4,
      formItemsConfig.row5,
      formItemsConfig.row6,
      formItemsConfig.row7,
      formItemsConfig.row8,
      formItemsConfig.row9,
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  function transformInputValues(values) {
    const newValues = cloneDeep(values)
    newValues.canLogIn = values.canLogIn === 1
    return newValues
  }

  function transformOutputValues(values) {
    const newValues = cloneDeep(values)
    newValues.canLogIn = values.canLogIn === 1 || values.canLogIn ? 1 : 0
    return newValues
  }

  function handleSubmit(values, formik) {
    const { setSubmitting } = formik
    setTimeout(() => {
      // eslint-disable-next-line no-console
      console.log(transformOutputValues(values))
      setSubmitting(false)
    }, 0)
  }

  useEffect(() => {
    if (!isLoading) {
      const newConfig = {
        id: 'contact-update',
        rows: items,
        debug: false,
        initialValues: transformInputValues({
          ...getInitialValues(items, false),
          ...data?.data,
        }),
      }

      if (!isEqual(config, newConfig)) {
        setConfig(newConfig)
      }
    }
  }, [isLoading, config, data, items])

  return !isLoading && !isEmpty(config) ? (
    <div style={{ padding: '20px' }}>
      <AspectPureFormik config={config} actions={{ submit: handleSubmit }} />
    </div>
  ) : (
    <div>loading</div>
  )
}

ContactDetailsFormFormik.whyDidYouRender = false
export default ContactDetailsFormFormik
