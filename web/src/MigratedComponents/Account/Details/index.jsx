import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useMutation, useQuery } from 'react-query'
import { useParams, useNavigate } from 'react-router-dom'
import isEqual from 'lodash/isEqual'
import isEmpty from 'lodash/isEmpty'
import keys from 'lodash/keys'
import reduce from 'lodash/reduce'
import map from 'lodash/map'
import includes from 'lodash/includes'
import cloneDeep from 'lodash/cloneDeep'
import replace from 'lodash/replace'
import isNil from 'lodash/isNil'
import itemsConfig from './config'
import fetchWrapperForQueries from '../../QueryFetch'
import AspectPureFormik from '../../Form/PureFormik'
import { getInitialValues } from '../../Form/PureFormik/Helpers'
import useI18n from '../../../Hooks/i18n/useI18n'
import Loading from '../../../globals/components/Loading.jsx'
import { FormSubmit } from './FormSubmit'
import mutationSuccess from './mutationSuccess'
import AccountEnableDisable from '../AccountEnableDisable'
import messages from './messages'
import { badRequestBuilder } from '../../../error/CommonErrorNotifications'

const FORM_METHOD = {
  ADD: 'add',
  UPDATE: 'update',
  SELF: 'self',
}

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
  const [actions, setActions] = useState([])

  const {
    isLoading,
    isError,
    data: queryData,
    error,
  } = useQuery(query?.key, async () => fetchWrapperForQueries({ endpoint: query?.endpoint }), {
    enabled: query?.enabled || false,
  })

  if (isError) {
    throw new Error(error)
  }

  function handleSubmit(_e, formik) {
    const baseOmitFields = [
      'country',
      'disabled',
      'disabledOn',
      'jobId',
      'jobFunctions',
      'stateName',
      'lgaName',
      'userId',
      'username',
      'userLockedOut',
    ]
    const { setSubmitting, values } = formik
    const { id } = values

    setTimeout(() => {
      if (type === FORM_METHOD.ADD) {
        mutation.mutate({
          values: transformOutputValues(values, baseOmitFields),
          endpoint: '/person',
          method: 'POST',
          customErrorNotifications: {
            409: badRequestBuilder(messages),
          },
        })
      }
      if (type === FORM_METHOD.UPDATE) {
        mutation.mutate({
          values: transformOutputValues(values, baseOmitFields),
          endpoint: `/person/${id}`,
          method: 'PUT',
          customErrorNotifications: {
            409: badRequestBuilder(messages),
          },
        })
      }
      if (type === FORM_METHOD.SELF) {
        mutation.mutate({
          values: transformOutputValues(values, [...baseOmitFields, 'canLogIn']),
          endpoint: '/account-details/current-contact',
          method: 'PUT',
        })
      }
      setSubmitting(false)
    }, 0)
  }

  function buildItems(action) {
    const tempItems = [
      formItemsConfig.row1,
      formItemsConfig.row2,
      formItemsConfig.row3,
      formItemsConfig.row4,
      formItemsConfig.row5,
      formItemsConfig.row6,
    ]
    if (type === FORM_METHOD.UPDATE) {
      tempItems.unshift(formItemsConfig.row0)
      // disabling tag input until we refactor tags
      // (https://ops.systemone.id/browse/ASP-2591)
      // tempItems.push(formItemsConfig.row7)
    }
    if (type === FORM_METHOD.SELF) {
      // disabling tag input until we refactor tags
      /// (https://ops.systemone.id/browse/ASP-2591)
      // tempItems.push(formItemsConfig.row7)
    }
    if (personId && type !== FORM_METHOD.SELF) {
      tempItems.push(formItemsConfig.row8)
    }
    return !isEqual(tempItems, items) ? action(tempItems) : items
  }

  useEffect(() => {
    switch (true) {
      case !!personId && personId !== FORM_METHOD.ADD && type !== FORM_METHOD.UPDATE && personId !== editor.userId:
        setType(FORM_METHOD.UPDATE)
        setQuery({
          key: [`get-user-${personId}`, personId],
          endpoint: `/person/${personId}`,
          enabled: true,
        })
        buildItems(setItems)
        break

      case !personId || (type !== FORM_METHOD.SELF && personId === editor.userId):
        setType(FORM_METHOD.SELF)
        setQuery({
          key: ['get-current-user'],
          endpoint: '/account-details/current',
          enabled: true,
        })
        buildItems(setItems)
        break

      case personId === FORM_METHOD.ADD:
        setType(FORM_METHOD.ADD)
        buildItems(setItems)
        break

      default:
        setType(FORM_METHOD.UPDATE)
        buildItems(setItems)
        break
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [personId, type])

  useEffect(() => {
    const baseSubmit = {
      id: 'submit',
      type: 'submit',
      color: 'primary',
      label: formatMessage(type === FORM_METHOD.ADD ? messages.create : messages.save),
      component: FormSubmit,
      action: handleSubmit,
    }

    const disableSubmit = {
      id: 'delete',
      type: 'button',
      color: 'error',
      label: formatMessage(messages.disable),
      component: AccountEnableDisable,
      sx: { backgroundColor: 'red' },
    }
    const enableSubmit = {
      id: 'enable',
      type: 'button',
      label: formatMessage(messages.enable),
      component: AccountEnableDisable,
      sx: { backgroundColor: 'green' },
    }

    switch (true) {
      case (type === FORM_METHOD.ADD || type === FORM_METHOD.SELF) && actions[0]?.label !== baseSubmit.label:
        setActions([baseSubmit])
        break

      case type === FORM_METHOD.UPDATE &&
        !isEmpty(queryData) &&
        queryData?.data?.disabled === 1 &&
        actions[0]?.label !== enableSubmit.label:
        setActions([enableSubmit])
        break

      case type === FORM_METHOD.UPDATE &&
        !isEmpty(queryData) &&
        queryData?.data?.disabled === 0 &&
        actions[0]?.label !== baseSubmit.label:
        setActions([baseSubmit, disableSubmit])
        break

      default:
        break
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryData, actions, type])

  const mutation = useMutation(
    ({ values, endpoint, method, customErrorNotifications }) => {
      return fetchWrapperForQueries({
        endpoint,
        method,
        params: { ...values },
        customErrorNotifications,
      })
    },
    {
      onError: error => {
        throw new Error(error)
      },
      onSuccess: ({ data: response, ok }) => mutationSuccess(queryData, response, navigate, type, ok),
    }
  )

  function transformInputValues(values) {
    let newValues = cloneDeep(values)
    newValues = reduce(
      keys(newValues),
      (acc, key) => {
        if (key !== 'undefined') {
          acc[key] = newValues[key]
        }
        return acc
      },
      {}
    )
    // explicitly set boolean value
    newValues.canLogIn = values.canLogIn === 1
    return newValues
  }

  function transformOutputValues(values, omitValues) {
    const newValues = cloneDeep(values)
    newValues.canLogIn = values?.canLogIn === 1 || values?.canLogIn ? 1 : 0
    newValues.phone = replace(values.phone, / /g, '')
    newValues.cell = replace(values.cell, / /g, '')
    /* eslint-disable lodash/collection-return */
    map(newValues, (value, key) => {
      if (key === 'undefined' || value === '' || isNil(value) || includes(omitValues, key)) delete newValues[key]
    })
    return newValues
  }

  useEffect(() => {
    if (!isLoading && editor) {
      const initialValues = transformInputValues({
        ...getInitialValues(items, false),
        countryId: editor.countryId,
        ...queryData?.data,
      })

      const newConfig = {
        id: 'contact-update',
        rows: items,
        debug: false,
        initialValues,
      }

      if (!isEqual(config, newConfig)) {
        setConfig(newConfig)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, config, queryData, items, editor, type])

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
