/* eslint-disable no-console */
// TODO - REMOVE ☝️
import React, { useState, useEffect, useMemo } from 'react'
import { useSelector } from 'react-redux'
import { useMutation, useQuery } from 'react-query'
import { useParams, useNavigate } from 'react-router-dom'
import isEqual from 'lodash/isEqual'
import isEmpty from 'lodash/isEmpty'
import cloneDeep from 'lodash/cloneDeep'
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
  const [config, setConfig] = useState(false)
  const formItemsConfig = itemsConfig(editor)
  const isUpdate = !!personId && personId !== 'add'
  const isSelfUpdate = !personId
  const isNew = personId === 'add'

  const { isLoading, isError, data, error } = useQuery(
    [`get-user-${personId}`, personId],
    async () =>
      fetchWrapperForQueries({
        endpoint: `/person/${personId}`,
      }),
    { enabled: isUpdate }
  )

  if (isError) {
    throw new Error(error)
  }

  const mutation = useMutation(({ values, endpoint, method }) => {
    return fetchWrapperForQueries({
      endpoint,
      method,
      params: {
        ...values,
      },
    })
  })

  function transformInputValues(values) {
    const newValues = cloneDeep(values)
    newValues.canLogIn = values.canLogIn === 1
    return newValues
  }

  function transformOutputValues(values) {
    const newValues = cloneDeep(values)
    newValues.canLogIn = values.canLogIn === 1 || values.canLogIn ? 1 : 0
    newValues.id = Number(newValues.id)
    delete newValues.userId
    delete newValues.username
    delete newValues.geogId
    delete newValues.hideNotes
    delete newValues.hidePatientId
    delete newValues.hideSampleId
    delete newValues.country
    delete newValues.jobFunctions
    delete newValues.jobId
    delete newValues.lgaName
    delete newValues.stateName
    delete newValues.userLockedOut
    return newValues
  }

  console.log(navigate, mutation)

  function handleSubmit(_e, formik) {
    const { setSubmitting, values } = formik
    // const { id } = values

    setTimeout(() => {
      if (isNew) {
        // https://demo.aspect.id/api/api/person POST
        console.log('adding new contact', transformOutputValues(values))
        // mutation.mutate({
        //   values: transformOutputValues(values),
        //   endpoint: '/person',
        //   method: 'POST',
        // })
      }
      if (isUpdate) {
        // https://demo.aspect.id/api/api/person/1 PUT
        console.log('updating a contact', transformOutputValues(values))
        // mutation.mutate({
        //   values: transformOutputValues(values),
        //   endpoint: `/person/${id}`,
        //   method: 'PUT',
        // })
      }
      if (isSelfUpdate) {
        // https://demo.aspect.id/api/account-details/current-contact PUT
        console.log('updating myself', transformOutputValues(values))
        // mutation.mutate({
        //   values: transformOutputValues(values),
        //   endpoint: '/account-details/current-contact',
        //   method: 'PUT',
        // })
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

  const items = useMemo(
    () => {
      const items = [
        formItemsConfig.row0,
        formItemsConfig.row1,
        formItemsConfig.row2,
        formItemsConfig.row3,
        formItemsConfig.row4,
        formItemsConfig.row5,
        formItemsConfig.row6,
        formItemsConfig.row7,
      ]
      if (personId) {
        items.push(formItemsConfig.row8)
      }
      return items
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

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
