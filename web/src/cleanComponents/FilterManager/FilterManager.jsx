import React, { useState } from 'react'
import { Card, Box, Button, Collapse } from '@mui/material'
import { MdClose, MdArrowDownward, MdArrowUpward } from 'react-icons/md'
import { useLocation } from 'react-router'
import { useFilter } from '../../providers/FilterProvider'

const excluded = ['countryId']

const filtersPerUrl = {
  '/browse/case': ['geography', 'state', 'lga', 'patientOrCaseId', 'sampleOriginSite', 'diseaseId', 'onlyDisease'],
  '/browse/deviceApiKey': ['geography', 'partnerId', 'deviceName', { siteName: ['site:view'] }, 'revoked'],
  '/browse/inventory/supplies': [
    'consumable',
    'geography',
    'state',
    'lga',
    { siteName: true, requiredPermissions: ['site:view'] },
    { date: true, isEnabled: dependencies => dependencies.breakOutByLot },
    { lotNumber: true, isEnabled: dependencies => dependencies.breakOutByLot },
    { daysStockLeft: true, isEnabled: dependencies => !dependencies.breakOutByLot },
    'hasStock',
  ],
  '/browse/inventory/log': [
    'consumable',
    'geography',
    'state',
    'lga',
    { siteName: true, requiredPermissions: ['site:view'] },
    'date',
    'onlyTransfers',
    'lotNumber',
    'expirationDate',
  ],
  '/browse/person': ['geography', 'state', 'lga', 'actions', 'contactNameOrEmail', 'contactStatus'],
  '/reports': ['geography', 'state', 'lga', { siteName: ['site:view'] }, 'date', 'reportName', 'consumable', 'assayId'],
  '/browse/reporter': ['geography', 'state', 'lga', 'date', 'deviceName', { assayId: ['assay:view'] }],
  '/browse/result': [
    { assayAndResultCategory: ['assay:view'] },
    'geography',
    'state',
    'lga',
    'date',
    'patientOrResearchId',
    'sampleId',
    'errorCode',
    { siteName: ['site:view'] },
    { reportableSiteName: ['site:view'] },
    { reportableSiteId: ['site:view'] },
    { deviceName: ['device'] },
    'deviceType',
    'sampleOriginSite',
    'workflowStatus',
    'treatmentStatus',
    'displayResult',
    'onlyReportableResults',
    'onlyDownloadedByReporter',
    'onlyEverTransferred',
    'onlyTreatmentRequired',
  ],
  '/browse/router': ['geography', 'state', 'lga', 'deviceName', 'deviceApproval'],
  '/browse/device/list': [
    'assayId',
    'geography',
    'state',
    'lga',
    'siteName',
    'deviceName',
    'deviceStatus',
    'deviceMaintenanceStatus',
    'deviceType',
    'deviceApproval',
    'issueTypeId',
    'connectorStatus',
  ],
  '/browse/device/workload': ['geography', 'state', 'lga', 'date', 'singleAssayId', 'deviceName'],
  '/browse/notification': ['geography', 'notificationName'],
  '/browse/site': ['geography', 'state', 'lga', 'siteName', 'externalId'],
}

const FilterManager = () => {
  const location = useLocation()
  const [filter, setFilter] = useFilter(location.pathname)
  const [expanded, setExpanded] = useState(false)

  const enabledFilters = filtersPerUrl[location.pathname]

  const addFilter = item => setFilter({ ...filter, ...item })

  const removeFilter = key => {
    const { [key]: removed, ...newFilter } = filter
    setFilter(newFilter)
  }

  const open = () => setExpanded(true)
  const close = () => setExpanded(false)

  return (
    <Card sx={{ mb: 1 }}>
      <Box sx={{ m: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span>
          {Object.keys(filter).map(k =>
            !excluded.includes(k) ? <Label l={`${k} ${filter[k]}`} onRemove={() => removeFilter(k)} /> : null
          )}
        </span>
        <Button variant="contained" sx={{ m: 0.25, height: '36px' }}>
          {expanded ? <MdArrowUpward onClick={close} /> : <MdArrowDownward onClick={open} />}
        </Button>
      </Box>
      <Collapse in={expanded} timeout="auto">
        <Box sx={{ m: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', ml: 1.25 }}>
          we will enable this filters:
          <pre>{JSON.stringify(enabledFilters, null, 2)}</pre>
          <Button variant="contained" sx={{ m: 0.25 }} onClick={() => addFilter({ ariel: 99 })}>
            Add ariel with ID 99
          </Button>
          <Button variant="contained" sx={{ m: 0.25 }} onClick={() => addFilter({ RANDOM: 'none' })}>
            Add RANDOM with ID 'none'
          </Button>
          <Button variant="contained" sx={{ m: 0.25 }} onClick={() => addFilter({ [Math.random()]: 'none' })}>
            Add RANDOM
          </Button>
        </Box>
      </Collapse>
    </Card>
  )
}

export default FilterManager

const Label = ({ l, onRemove }) => {
  return (
    <Button color="secondary" variant="contained" sx={{ m: 0.25 }} onClick={onRemove}>
      {l} <MdClose />
    </Button>
  )
}
