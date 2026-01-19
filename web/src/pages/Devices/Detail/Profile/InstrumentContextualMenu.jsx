import PropTypes from 'prop-types'
import React, { Fragment, useState } from 'react'
import { useIntl } from 'react-intl'
import AspectVertMenu from '../../../../components/AspectVertMenu'
import messages from './messages'
import MoveToExistingDeviceModal from './MoveToExistingDeviceModal'
import MoveToNewDeviceModal from './MoveToNewDeviceModal'

const InstrumentContextualMenu = ({ instrument, deviceId, onMoveToExisting, onMoveToNew }) => {
  const { formatMessage } = useIntl()
  const [menuOpen, setMenuOpen] = useState(false)
  const [newDeviceModalOpen, setNewDeviceModalOpen] = useState(false)
  const [existingDeviceModalOpen, setExistingDeviceModalOpen] = useState(false)

  const actions = [
    {
      icon: 'FaExchangeAlt',
      text: formatMessage(messages.moveToExistingDevice),
      action: () => {
        setMenuOpen(false)
        setExistingDeviceModalOpen(true)
      },
    },
    {
      icon: 'FaPlus',
      text: formatMessage(messages.moveToNewDevice),
      action: () => {
        setMenuOpen(false)
        setNewDeviceModalOpen(true)
      },
    },
  ]

  const handleNewDeviceModalConfirm = formData => {
    setNewDeviceModalOpen(false)
    onMoveToNew({ ...instrument, ...formData })
  }

  const handleExistingDeviceModalConfirm = formData => {
    setExistingDeviceModalOpen(false)
    onMoveToExisting({ ...instrument, ...formData })
  }

  return (
    <Fragment>
      <AspectVertMenu actions={actions} open={menuOpen} setOpen={setMenuOpen} />
      <MoveToNewDeviceModal
        open={newDeviceModalOpen}
        onClose={() => setNewDeviceModalOpen(false)}
        onConfirm={handleNewDeviceModalConfirm}
        instrumentId={instrument.instrumentId}
      />
      <MoveToExistingDeviceModal
        open={existingDeviceModalOpen}
        onClose={() => setExistingDeviceModalOpen(false)}
        onConfirm={handleExistingDeviceModalConfirm}
        instrumentId={instrument.instrumentId}
        deviceId={deviceId}
      />
    </Fragment>
  )
}

InstrumentContextualMenu.propTypes = {
  deviceId: PropTypes.number.isRequired,
  instrument: PropTypes.object.isRequired,
  onMoveToExisting: PropTypes.func.isRequired,
  onMoveToNew: PropTypes.func.isRequired,
}

export default InstrumentContextualMenu
