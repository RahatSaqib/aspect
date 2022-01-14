import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useMutation, useQuery } from 'react-query'
import { useParams, useNavigate } from 'react-router-dom'
import isEqual from 'lodash/isEqual'
import isEmpty from 'lodash/isEmpty'
import map from 'lodash/map'
import includes from 'lodash/includes'
import cloneDeep from 'lodash/cloneDeep'
import replace from 'lodash/replace'
import itemsConfig from './config'
import fetchWrapperForQueries from '../../QueryFetch'
import AspectPureFormik from '../../Form/PureFormik'
import { getInitialValues } from '../../Form/PureFormik/Helpers'
import useI18n from '../../../Hooks/i18n/useI18n'
import Loading from '../../../globals/components/Loading.jsx'
import FormSubmit from './FormSubmit'
import messages from './messages'

const ContactDetailsFormFormik = () => {
  const { personId } = useParams()
  const navigate = useNavigate()
  const { formatMessage } = useI18n()
  const editor = useSelector(({ user }) => user.toJS())
  const [type, setType] = useState()
  const [items, setItems] = useState()
  const [query, setQuery] = useState({
    key: 'new',
    endpoint: '/',
    enabled: false,
  })
  const [config, setConfig] = useState(false)
  const formItemsConfig = itemsConfig(editor)

  const {
    isLoading,
    isError,
    data: queryData,
    error,
  } = useQuery(
    query?.key,
    async () => fetchWrapperForQueries({ endpoint: query?.endpoint }),
    { enabled: query?.enabled || false }
  )

  if (isError) {
    throw new Error(error)
  }

  function handleSubmit(_e, formik) {
    const baseOmitFields = [
      'country',
      'jobId',
      'jobFunctions',
      'stateName',
      'userId',
      'username',
    ]
    const { setSubmitting, values } = formik
    const { id } = values
    const sanitisedValues = transformOutputValues(values, baseOmitFields)

    setTimeout(() => {
      if (type === 'add') {
        mutation.mutate({
          values: sanitisedValues,
          endpoint: '/person',
          method: 'POST',
        })
      }
      if (type === 'update') {
        mutation.mutate({
          values: sanitisedValues,
          endpoint: `/person/${id}`,
          method: 'PUT',
        })
      }
      if (type === 'self') {
        mutation.mutate({
          values: sanitisedValues,
          endpoint: '/account-details/current-contact',
          method: 'PUT',
        })
      }
      setSubmitting(false)
    }, 0)
  }

  const actions = [
    {
      id: 'submit',
      type: 'submit',
      color: 'primary',
      label: formatMessage(type === 'add' ? messages.create : messages.save),
      component: FormSubmit,
      action: handleSubmit,
    },
  ]

  function buildItems(action) {
    const tempItems = [
      formItemsConfig.row1,
      formItemsConfig.row2,
      formItemsConfig.row3,
      formItemsConfig.row4,
      formItemsConfig.row5,
      formItemsConfig.row6,
    ]
    if (type === 'update') {
      tempItems.unshift(formItemsConfig.row0)
      // disabling tag input until we refactor tags
      // (https://ops.systemone.id/browse/ASP-2591)
      // tempItems.push(formItemsConfig.row7)
    }
    if (type === 'self') {
      // disabling tag input until we refactor tags
      /// (https://ops.systemone.id/browse/ASP-2591)
      // tempItems.push(formItemsConfig.row7)
    }
    if (personId) {
      tempItems.push(formItemsConfig.row8)
    }
    return !isEqual(tempItems, items) ? action(tempItems) : items
  }

  useEffect(() => {
    switch (true) {
      case !!personId && personId !== 'add' && type !== 'update':
        setType('update')
        setQuery({
          key: [`get-user-${personId}`, personId],
          endpoint: `/person/${personId}`,
          enabled: true,
        })
        buildItems(setItems)
        break

      case !personId && type !== 'self':
        setType('self')
        setQuery({
          key: ['get-current-user'],
          endpoint: '/account-details/current',
          enabled: true,
        })
        buildItems(setItems)
        break

      case personId === 'add':
        setType('add')
        buildItems(setItems)
        break

      default:
        buildItems(setItems)
        break
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [personId, type])

  const mutation = useMutation(
    ({ values, endpoint, method }) => {
      return fetchWrapperForQueries({ endpoint, method, params: { ...values } })
    },
    {
      onError: error => {
        throw new Error(error)
      },
      onSuccess: ({ data: response, ok }) => {
        const updatedLogin =
          response.canLogIn && queryData?.data?.canLogIn !== response.canLogIn
        switch (true) {
          case type === 'add' && ok:
            navigate(`/browse/person/${response?.id}`)
            break

          case type === 'update' && updatedLogin && ok:
            navigate(`/browse/person/${response?.id}/system-access-control`)
            window.location.reload()
            break

          case type === 'update' && !updatedLogin && ok:
            navigate('/browse/person')
            break

          default:
            throw new Error(
              `Could not complete the operation. Type: ${type} | Status: ${
                ok ? 'true' : 'false'
              }`
            )
        }
      },
    }
  )

  function transformInputValues(values) {
    const newValues = cloneDeep(values)
    newValues.canLogIn = values.canLogIn === 1
    return newValues
  }

  function transformOutputValues(values, omitValues) {
    const newValues = cloneDeep(values)
    map(newValues, (value, key) =>
      isEmpty(value) || includes(omitValues, key)
        ? delete newValues[key]
        : false
    )
    newValues.canLogIn = values?.canLogIn === 1 || values?.canLogIn ? 1 : 0
    newValues.phone = replace(values.phone, / /g, '')
    newValues.cell = replace(values.cell, / /g, '')
    return newValues
  }

  useEffect(() => {
    if (!isLoading && editor) {
      const newConfig = {
        id: 'contact-update',
        rows: items,
        debug: false,
        initialValues: transformInputValues({
          ...getInitialValues(items, false),
          countryId: editor.countryId,
          ...queryData?.data,
        }),
      }

      if (!isEqual(config, newConfig)) {
        setConfig(newConfig)
      }
    }
  }, [isLoading, config, queryData, items, editor])

  return !isLoading && !isEmpty(config) ? (
    <div style={{ padding: '20px' }}>
      <AspectPureFormik config={config} actions={actions} />
    </div>
  ) : (
    <div
      style={{
        height: 'calc(100vh - 120px)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Loading />
    </div>
  )
}

ContactDetailsFormFormik.whyDidYouRender = false
export default ContactDetailsFormFormik
