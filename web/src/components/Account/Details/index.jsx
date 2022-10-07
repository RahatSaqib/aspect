import React, { useState, useEffect } from 'react'
import cloneDeep from 'lodash/cloneDeep'
import includes from 'lodash/includes'
import isArray from 'lodash/isArray'
import isEmpty from 'lodash/isEmpty'
import isEqual from 'lodash/isEqual'
import isNil from 'lodash/isNil'
import keys from 'lodash/keys'
import map from 'lodash/map'
import reduce from 'lodash/reduce'
import replace from 'lodash/replace'
import { useMutation, useQuery } from 'react-query'
import { useSelector } from 'react-redux'
import { useParams, useNavigate } from 'react-router-dom'
import useI18n from '../../../hooks/useI18n'
import Loading from '../../../oldComponents/Loading.jsx'
import { badRequestBuilder } from '../../../utils/error/CommonErrorNotifications'
import AspectPureFormik from '../../Form/PureFormik'
import { getInitialValues } from '../../Form/PureFormik/Helpers'
import fetchWrapperForQueries from '../../QueryFetch'
import AccountEnableDisable from '../AccountEnableDisable'
import itemsConfig from './config'
import { FormSubmit } from './FormSubmit'
import messages from './messages'
import mutationSuccess from './mutationSuccess'

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
  const [query, setQuery] = useState({ key: 'new', endpoint: '/', enabled: false })
  const [config, setConfig] = useState(false)
  const baseCfg = itemsConfig(editor)
  const [actions, setActions] = useState([])

  const {
    isLoading,
    isError,
    data: queryData,
    error,
  } = useQuery(query?.key, async () => fetchWrapperForQueries({ endpoint: query?.endpoint }), {
    enabled: query?.enabled || false,
  })

  const mutation = useMutation(
    ({ values, endpoint, method, customErrorNotifications }) => {
      return fetchWrapperForQueries({ endpoint, method, params: { ...values }, customErrorNotifications })
    },
    {
      onError: error => {
        throw new Error(error)
      },
      onSuccess: ({ data: response, ok }) => mutationSuccess(queryData, response, navigate, type, ok),
    }
  )

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
      } else if (type === FORM_METHOD.UPDATE) {
        mutation.mutate({
          values: transformOutputValues(values, baseOmitFields),
          endpoint: `/person/${id}`,
          method: 'PUT',
          customErrorNotifications: {
            409: badRequestBuilder(messages),
          },
        })
      } else if (type === FORM_METHOD.SELF) {
        mutation.mutate({
          values: transformOutputValues(values, [...baseOmitFields, 'canLogIn']),
          endpoint: '/account-details/current-contact',
          method: 'PUT',
        })
      }
      setSubmitting(false)
    }, 0)
  }

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

  useEffect(() => {
    //
    const tempItems = [baseCfg.row1, baseCfg.row2, baseCfg.row3, baseCfg.row4, baseCfg.row5, baseCfg.row6, baseCfg.row7]
    if (personId === FORM_METHOD.ADD) {
      // adding a person
      setType(FORM_METHOD.ADD)
      tempItems.unshift(baseCfg.row0)
      tempItems.push(baseCfg.row8)
    } else if (!personId || personId === editor.userId) {
      // editing myself
      setType(FORM_METHOD.SELF)
      setQuery({ key: ['get-current-user'], endpoint: '/account-details/current', enabled: true })
    } else if (personId !== editor.userId) {
      // editing someone else
      setType(FORM_METHOD.UPDATE)
      setQuery({ key: [`get-user-${personId}`, personId], endpoint: `/person/${personId}`, enabled: true })
      tempItems.unshift(baseCfg.row0)
      tempItems.push(baseCfg.row8)
    }
    return !isEqual(tempItems, items) ? setItems(tempItems) : items
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
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
    newValues.tags = isArray(values.tags) ? values.tags.join(',') : values.tags

    /* eslint-disable lodash/collection-return */
    map(newValues, (value, key) => {
      if (key === 'undefined' || isNil(value) || includes(omitValues, key)) delete newValues[key]
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
    <div style={{ height: 'calc(100vh - 120px)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <Loading />
    </div>
  )
}

ContactDetailsFormFormik.whyDidYouRender = false
export default ContactDetailsFormFormik
