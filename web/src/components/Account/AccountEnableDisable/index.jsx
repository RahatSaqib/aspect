import React, { Fragment, useState } from 'react'
import { useLocation, useSearchParams, useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { useMutation } from 'react-query'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import { Person, PersonOff } from '@mui/icons-material'
import { FormAction } from '../Details/FormSubmit'
import { DataTableCell as TableCell } from '../../../oldComponents/shared/tableBody'
import AspectDialog from '../../../oldComponents/shared/AspectDialog'
import fetchWrapperForQueries from '../../QueryFetch'
import { fetchPersons } from '../../../store/PersonRedux'
import useI18n from '../../../hooks/i18n/useI18n'
import messages from './messages'

const IconContainer = ({ icon: Icon, style, action }) => (
  <IconButton variant="contained" onClick={action}>
    <Icon style={{ fontSize: '1.35rem', ...style }} />{' '}
  </IconButton>
)

const AccountEnableDisable = props => {
  const { person } = props
  const { formatMessage } = useI18n()
  const location = useLocation()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [confirmationData, setConfirmationData] = useState(false)

  const dispatch = useDispatch()

  const mutation = useMutation(
    ({ values, endpoint, method }) => {
      return fetchWrapperForQueries({ endpoint, method, params: { ...values } })
    },
    {
      onError: error => {
        throw new Error(error)
      },
      onSuccess: ({ ok }) => {
        if (ok) {
          const searchParams = new URLSearchParams(location.search)
          const filtersParams = new URLSearchParams(searchParams.get('filters') || '')
          const pageAt = params.get('pageAt') || 0
          const pageSize = params.get('pageSize') || 25
          const sortCol = params.get('sortCol') || 'name'
          const sortDir = params.get('sortDir') || 'asc'
          if (confirmationData?.type === 'button') {
            navigate(0)
          } else {
            dispatch(fetchPersons(filtersParams, sortCol, sortDir, pageAt, pageSize))
          }
        }
      },
    }
  )

  function handleDisablePrompt() {
    const { type, formik, person } = props
    const personData = type === 'button' ? formik?.initialValues : person?.toJS()
    setConfirmationData({ ...personData, type })
    setShowConfirmation(true)
  }

  function handleEnableDisable() {
    setShowConfirmation(false)
    let payload
    if (confirmationData?.disabled === 0) {
      payload = {
        endpoint: `/person/${confirmationData?.id}`,
        method: 'DELETE',
      }
    } else {
      payload = {
        endpoint: `/person/enable/${confirmationData?.id}`,
        method: 'PUT',
      }
    }
    try {
      mutation.mutate(payload)
    } catch (err) {
      throw new Error(err)
    }
  }

  return (
    <Fragment>
      {props?.type === 'button' ? <FormAction {...props} action={handleDisablePrompt} /> : null}
      {props?.type === 'icon' ? (
        <TableCell>
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-start',
              alignItems: 'center',
              paddingLeft: '25px',
            }}
          >
            {person.get('disabled') === 0 ? (
              <IconContainer icon={Person} style={{ color: 'green' }} action={handleDisablePrompt} />
            ) : (
              <IconContainer icon={PersonOff} style={{ color: 'red' }} action={handleDisablePrompt} />
            )}
          </div>
        </TableCell>
      ) : null}
      <AspectDialog
        actions={[
          <Button color="primary" onClick={() => setShowConfirmation(false)}>
            {formatMessage(messages.cancel)}
          </Button>,
          <Button color="primary" variant="contained" onClick={() => handleEnableDisable()}>
            {formatMessage(messages.yes)}
          </Button>,
        ]}
        maxWidth="sm"
        open={showConfirmation}
        onClose={() => setShowConfirmation(false)}
      >
        <h3>{confirmationData?.name}</h3>
        <div style={{ marginTop: '15px' }}>
          {confirmationData?.disabled > 0 ? formatMessage(messages.enableUser) : formatMessage(messages.disableUser)}
        </div>
      </AspectDialog>
    </Fragment>
  )
}

export default AccountEnableDisable
