import React, { Fragment, useState } from 'react'
import { Person, PersonOff } from '@mui/icons-material'
import { Button, IconButton } from '@mui/material'
import { useIntl } from 'react-intl'
import { useMutation } from 'react-query'
import fetchWrapperForQueries from '../../../../components/QueryFetch'
import AspectDialog from '../../../../oldComponents/shared/AspectDialog'
import { DataTableCell as TableCell } from '../../../../oldComponents/shared/tableBody'
import { FormAction } from './FormSubmit'
import messages from './messages'

const IconContainer = ({ icon: Icon, style, action }) => (
  <IconButton variant="contained" onClick={action}>
    <Icon style={{ fontSize: '1.35rem', ...style }} />{' '}
  </IconButton>
)

const AccountEnableDisable = ({ onSuccess, ...props }) => {
  const { person } = props
  const { formatMessage } = useIntl()
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [confirmationData, setConfirmationData] = useState(false)

  const mutation = useMutation(
    ({ values, endpoint, method }) => {
      return fetchWrapperForQueries({ endpoint, method, params: { ...values } })
    },
    {
      onError: error => {
        throw new Error(error)
      },
      onSuccess: () => {
        onSuccess()
      },
    }
  )

  function handleDisablePrompt() {
    const { type, formik, person } = props
    const personData = type === 'button' ? formik?.initialValues : person
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
            {person.disabled === 0 ? (
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
