import React, { Fragment } from 'react'
import classnames from 'classnames/bind'
import { defineMessages } from 'react-intl'
import IconButton from '@material-ui/core/IconButton'
import Tooltip from '@material-ui/core/Tooltip'
import { Person, PersonOff } from '@material-ui/icons'
import { FormAction } from '../Details/FormSubmit'
import { DataTableCell as TableCell } from '../../../components/shared/tableBody'

// import Button from '@material-ui/core/Button'
// import { useMutation } from 'react-query'
// import fetchWrapperForQueries from '../../MigratedComponents/QueryFetch'
// import AspectDialog from '../../components/shared/AspectDialog'

// import { i18nWrapper } from '../../Providers/I18nProvider/index'
// import { formatDate } from '../../shared/utils/dateFormat'

// // const cssClasses = classnames.bind(styles)

// const { formatMessage } = i18nWrapper()
// const messages = {
//   ...defineMessages({
//     disabledOn: {
//       id: 'pages.PersonList.disabled.title',
//       defaultMessage: 'This person was disabled on',
//     },
//   }),
// }

// const dispatch = useDispatch()

const IconContainer = ({ icon: Icon, style, action }) => (
  <IconButton variant="contained" onClick={action}>
    <Icon style={{ fontSize: '1.35rem', ...style }} />{' '}
  </IconButton>
)

const AccountEnableDisable = props => {
  const { person } = props
  function handleDisable() {
    console.log('disable')
  }
  function handleEnable() {
    console.log('enable')
  }

  //   const showDeleteAlert = person => {
  //     setPersonName(person.get('name'))
  //     setPersonId(person.get('id'))
  //     setPersonDisabled(person.get('disabled'))
  //     setShowConfirmation(true)
  //   }
  //   const handleEnableDisable = async () => {
  //     setShowConfirmation(false)
  //     let payload = {
  //       endpoint: `/person/enable/${personId}`,
  //       method: 'PUT',
  //     }
  //     if (personDisabled === 0) {
  //       payload = {
  //         endpoint: `/person/${personId}`,
  //         method: 'DELETE',
  //       }
  //     }
  //     try {
  //       mutation.mutate(payload)
  //     } catch (err) {
  //       console.log(err) // eslint-disable-line
  //     }
  //   }

  //   const [showConfirmation, setShowConfirmation] = useState(false)
  //   const [personName, setPersonName] = useState('')
  //   const [personId, setPersonId] = useState()
  //   const [personDisabled, setPersonDisabled] = useState(0)

  //   const mutation = useMutation(
  //     ({ values, endpoint, method }) => {
  //       return fetchWrapperForQueries({ endpoint, method, params: { ...values } })
  //     },
  //     {
  //       onError: error => {
  //         throw new Error(error)
  //       },
  //       onSuccess: ({ ok }) => {
  //         if (ok) {
  //           const searchParams = new URLSearchParams(location.search)
  //           const filtersParams = new URLSearchParams(
  //             searchParams.get('filters') || ''
  //           )
  //           dispatch(
  //             fetchPersons(filtersParams, sortCol, sortDir, pageAt, pageSize)
  //           )
  //         }
  //       },
  //     }
  //   )

  return (
    <Fragment>
      {props?.type === 'button' ? (
        <FormAction {...props} action={handleDisable} />
      ) : null}
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
              <Tooltip title="User disabled">
                <IconContainer
                  icon={Person}
                  style={{ color: 'green' }}
                  action={handleDisable}
                />
              </Tooltip>
            ) : (
              <IconContainer
                icon={PersonOff}
                style={{ color: 'red' }}
                action={handleEnable}
              />
            )}
          </div>
        </TableCell>
      ) : null}
      {/* <AspectDialog
        actions={[
          <Button color="primary" onClick={() => setShowConfirmation(false)}>
            {formatMessage(messages.cancel)}
          </Button>,
          <Button
            color="primary"
            variant="contained"
            onClick={handleEnableDisable}
          >
            {formatMessage(messages.yes)}
          </Button>,
        ]}
        maxWidth="sm"
        open={showConfirmation}
        onClose={() => setShowConfirmation(false)}
      >
        <h3>
          {personDisabled
            ? formatMessage(messages.enable)
            : formatMessage(messages.disable)}{' '}
          - <b>{personName}</b>?
        </h3>
      </AspectDialog> */}
    </Fragment>
  )
}

export default AccountEnableDisable

// {personEditPermission && (
//     <TableCell className="ActionsContainer" onClick={onClickEnableDisable}>
//       {person.get('disabled') === 1 ? (
//         <Tooltip
//           title={`${formatMessage(messages.disabledOn)} ${formatDate(
//             person.get('disabledAt')
//           )}`}
//         >
//           <IconButton
//             variant="contained"
//             className={cssClasses('DisableButton')}
//           >
//             <PersonAdd style={{ fontSize: '1.25rem' }} />
//           </IconButton>
//         </Tooltip>
//       ) : (
//         <IconButton
//           variant="contained"
//           className={cssClasses('EnableButton')}
//         >
//           <PersonRemove style={{ fontSize: '1.25rem' }} />
//         </IconButton>
//       )}
//     </TableCell>
//   )}
