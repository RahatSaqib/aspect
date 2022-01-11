/* eslint-disable no-console */
// TODO - REMOVE ☝️
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
// import Button from '@material-ui/core/Button'
import itemsConfig from './config'
import fetchWrapperForQueries from '../../QueryFetch'
import AspectPureFormik from '../../Form/PureFormik'
import { getInitialValues } from '../../Form/PureFormik/Helpers'
import Loading from '../../../globals/components/Loading.jsx'

// const FormSubmit = props => {
//   const { label, type, color, action = () => false } = props
//   console.log(action)

//   return (
//     <Button
//       type={type}
//       color={color}
//       variant="contained"
//       onClick={action}
//       // disabled={loading || form.pristine || !form.valid || form.submitting}
//     >
//       {label}
//       {/* {formatMessage(isNew ? messages.create : messages.save)} */}
//     </Button>
//   )
// }

const ContactDetailsFormFormik = () => {
  const { personId } = useParams()
  const navigate = useNavigate()
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

  const { isLoading, isError, data, error } = useQuery(
    query?.key,
    async () => fetchWrapperForQueries({ endpoint: query?.endpoint }),
    { enabled: query?.enabled || false }
  )

  if (isError) {
    throw new Error(error)
  }

  function buildItems() {
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
      tempItems.push(formItemsConfig.row7)
    }
    if (type === 'self') {
      tempItems.push(formItemsConfig.row7)
    }
    if (personId) {
      tempItems.push(formItemsConfig.row8)
    }
    return !isEqual(tempItems, items) ? setItems(tempItems) : items
  }

  useEffect(() => {
    switch (true) {
      case !!personId && personId !== 'add' && type !== 'update':
        console.log(personId, type)
        setType('update')
        setQuery({
          key: [`get-user-${personId}`, personId],
          endpoint: `/person/${personId}`,
          enabled: true,
        })
        buildItems()
        break

      case !personId && type !== 'self':
        setType('self')
        setQuery({
          key: ['get-current-user'],
          endpoint: '/account-details/current',
          enabled: true,
        })
        buildItems()
        break

      case personId === 'add':
        setType('add')
        buildItems()
        break

      default:
        buildItems()
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
        const updatedLogin = data?.data?.canLogIn !== response.canLogIn
        switch (true) {
          case type === 'add' && ok:
            navigate(`/browse/person/${response?.id}`)
            break

          case type === 'update' && updatedLogin && ok:
            navigate(`/browse/person/${response?.id}/system-access-control`)
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
    console.log(values, newValues)
    return newValues
  }

  function handleSubmit(_e, formik) {
    const baseOmitFields = ['country', 'userId', 'username']
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

  // const actions = [
  //   {
  //     id: 'submit',
  //     type: 'submit',
  //     color: 'primary',
  //     label: 'Save',
  //     component: FormSubmit,
  //     action: handleSubmit,
  //   },
  // ]

  // const items = useMemo(
  //   () => buildItems(),
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  //   []
  // )

  useEffect(() => {
    if (!isLoading && editor) {
      const newConfig = {
        id: 'contact-update',
        rows: items,
        debug: false,
        initialValues: transformInputValues({
          ...getInitialValues(items, false),
          countryId: editor.countryId,
          ...data?.data,
        }),
      }

      if (!isEqual(config, newConfig)) {
        setConfig(newConfig)
      }
    }
  }, [isLoading, config, data, items, editor])

  return !isLoading && !isEmpty(config) ? (
    <div style={{ padding: '20px' }}>
      <AspectPureFormik config={config} action={handleSubmit} />
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
