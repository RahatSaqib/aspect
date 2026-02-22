import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Card,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Table,
  TableBody,
  TableContainer,
} from '@mui/material'
import PropTypes from 'prop-types'
import { useIntl } from 'react-intl'
import { toast } from 'react-toastify'
import AspectVertMenu from '../../../../components/AspectVertMenu'
import PermissionChecker from '../../../../components/PermissionChecker'
import useCheckDeploymentResults from '../../../../hooks/device/useCheckDeploymentResults'
import useDeployments from '../../../../hooks/device/useDeployments'
import usePersistDeployments from '../../../../hooks/device/usePersistDeployments'
import AspectButton from '../../../../oldComponents/shared/AspectButton'
import { DataTableCell as TableCell, DataTableRow as TableRow } from '../../../../oldComponents/shared/tableBody'
import DataTableHead from '../../../../oldComponents/shared/tableHead'
import styles from '../styles.module.css'
import AddDeploymentDialog from './AddDeploymentDialog'
import EditDeploymentDialog from './EditDeploymentDialog'
import messages from './messages'

/** Deployment start/end are date-only; show as stored with no timezone conversion. */
function getDeploymentDateString(value) {
  if (value == null) return null
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10)
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10)
}

/** Sort deployments chronologically: null start (oldest/first) comes first. */
function sortChronological(deps) {
  return [...deps].sort((a, b) => {
    if (a.start === null) return -1
    if (b.start === null) return 1
    return new Date(a.start) - new Date(b.start)
  })
}

/** Return YYYY-MM-DD string for the day before the given date string. */
function dayBefore(dateStr) {
  if (!dateStr) return null
  const d = new Date(dateStr)
  d.setDate(d.getDate() - 1)
  return d.toISOString().slice(0, 10)
}

/**
 * Apply a field update to an existing change record or push a new 'update' change.
 * Mutates the `changes` array in place.
 */
function applyUpdateChange(changes, dep, fields) {
  if (dep.isNew) {
    const c = changes.find(x => x.tempId === dep.id && x.action === 'add')
    if (c) Object.assign(c, fields)
  } else {
    const existingIdx = changes.findIndex(x => x.id === dep.id && x.action === 'update')
    if (existingIdx >= 0) {
      Object.assign(changes[existingIdx], fields)
    } else {
      changes.push({
        action: 'update',
        id: dep.id,
        siteId: dep.siteId,
        siteName: dep.siteName,
        start: dep.start ? getDeploymentDateString(dep.start) : null,
        end: dep.end ? getDeploymentDateString(dep.end) : null,
        ...fields,
      })
    }
  }
}

/**
 * Validate that the working deployments form a valid continuous timeline:
 * - Exactly one null start (oldest), exactly one null end (active).
 * - All adjacent pairs are consecutive (dep[i].end + 1 == dep[i+1].start).
 * Returns a message key or null.
 */
function getDeploymentValidationError(deployments) {
  if (!deployments || deployments.length === 0) return null
  const sorted = sortChronological(deployments)

  const nullStartCount = sorted.filter(d => d.start === null).length
  const nullEndCount = sorted.filter(d => d.end === null).length

  if (nullStartCount > 1 || nullEndCount > 1) return 'deploymentNotConsecutive'
  if (sorted.length > 0 && (nullStartCount !== 1 || nullEndCount !== 1)) return 'deploymentNotConsecutive'

  for (let i = 0; i < sorted.length - 1; i++) {
    const current = sorted[i]
    if (!current.end) return 'deploymentNotConsecutive'
    const currentEndStr = getDeploymentDateString(current.end)
    const nextStartStr = getDeploymentDateString(sorted[i + 1].start)
    if (!currentEndStr || !nextStartStr) return 'deploymentNotConsecutive'
    const expectedNextStart = (() => {
      const d = new Date(currentEndStr)
      d.setDate(d.getDate() + 1)
      return d.toISOString().slice(0, 10)
    })()
    if (nextStartStr !== expectedNextStart) return 'deploymentNotConsecutive'
  }

  return null
}

const DeploymentsSection = ({ deviceId, disabled }) => {
  const { formatMessage } = useIntl()
  const { data: deploymentsData, isLoading, refetch } = useDeployments(deviceId)
  const checkResults = useCheckDeploymentResults()
  const persistMutation = usePersistDeployments()

  const [pendingChanges, setPendingChanges] = useState([])
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editingDeployment, setEditingDeployment] = useState(null)
  const [deletingDeployment, setDeletingDeployment] = useState(null)
  const [preview, setPreview] = useState(null)
  const [saveError, setSaveError] = useState(null)

  const hasPendingChanges = pendingChanges.length > 0

  // Apply pending changes on top of server data to get the current working list
  const workingDeployments = useMemo(() => {
    const serverDeployments = deploymentsData?.deployments ?? []
    let result = serverDeployments.map(d => ({ ...d, status: 'saved' }))

    for (const change of pendingChanges) {
      if (change.action === 'delete') {
        result = result.filter(d => d.id !== change.id)
      } else if (change.action === 'update') {
        result = result.map(d =>
          d.id === change.id
            ? {
                ...d,
                siteId: change.siteId,
                siteName: change.siteName,
                start: change.start,
                end: change.end,
                status: 'pending',
              }
            : d
        )
      } else if (change.action === 'add') {
        result.push({
          id: change.tempId,
          siteId: change.siteId,
          siteName: change.siteName,
          start: change.start,
          end: change.end ?? null,
          status: 'pending',
          isNew: true,
        })
      }
    }

    // Display order: most recent first; null start (oldest) is always last
    result.sort((a, b) => {
      if (a.start === null) return 1
      if (b.start === null) return -1
      return new Date(b.start) - new Date(a.start)
    })
    return result
  }, [deploymentsData, pendingChanges])

  // The active (last) deployment: always null end
  const activeDeployment = useMemo(() => workingDeployments.find(d => !d.end), [workingDeployments])

  // Trigger check-results preview whenever pending changes change
  useEffect(() => {
    if (!hasPendingChanges) {
      setPreview(null)
      return
    }
    const proposedDeployments = workingDeployments.map(d => ({
      siteId: d.siteId,
      start: d.start ? getDeploymentDateString(d.start) : null,
      end: d.end ? getDeploymentDateString(d.end) : null,
    }))
    checkResults.mutate(
      { deviceId, deployments: proposedDeployments },
      {
        onSuccess: data => setPreview(data),
        onError: () => setPreview(null),
      }
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingChanges, deviceId])

  /**
   * Add a new active deployment.
   * - First deployment (no active exists): start is null (covers from the beginning).
   * - Subsequent deployments: start is a date string; the current active is closed at (start - 1).
   */
  const handleAddDeployment = useCallback(
    ({ siteId, siteName, start }) => {
      const newChanges = [...pendingChanges]

      if (activeDeployment) {
        // Subsequent deployment: requires a start date
        const newStartStr = typeof start === 'string' ? start : null
        if (!newStartStr) return false
        applyUpdateChange(newChanges, activeDeployment, { end: dayBefore(newStartStr) })
        newChanges.push({
          action: 'add',
          tempId: `temp-${Date.now()}`,
          siteId,
          siteName,
          start: newStartStr,
          end: null,
        })
      } else {
        // First deployment: no start date (covers from the beginning)
        newChanges.push({ action: 'add', tempId: `temp-${Date.now()}`, siteId, siteName, start: null, end: null })
      }

      setPendingChanges(newChanges)
      return true
    },
    [pendingChanges, activeDeployment]
  )

  /**
   * Edit a deployment. Receives { siteId, siteName, start }.
   * Start is null for the first deployment (cannot be changed).
   * If start changes, the previous deployment's end is auto-adjusted to (newStart - 1).
   */
  const handleEditDeployment = useCallback(
    ({ siteId, siteName, start }) => {
      if (!editingDeployment) return
      const dep = editingDeployment
      const newChanges = [...pendingChanges]

      const newStartStr = start ? getDeploymentDateString(start) : null
      const oldStartStr = dep.start ? getDeploymentDateString(dep.start) : null

      // If start changed, adjust the previous deployment's end
      if (newStartStr !== oldStartStr && newStartStr) {
        const sorted = sortChronological(workingDeployments)
        const idx = sorted.findIndex(d => d.id === dep.id)
        const prev = idx > 0 ? sorted[idx - 1] : null
        if (prev) {
          applyUpdateChange(newChanges, prev, { end: dayBefore(newStartStr) })
        }
      }

      applyUpdateChange(newChanges, dep, { siteId, siteName, start: newStartStr })
      setPendingChanges(newChanges)
      setEditingDeployment(null)
    },
    [pendingChanges, editingDeployment, workingDeployments]
  )

  /**
   * Delete a deployment, adjusting adjacent deployments to maintain continuous timeline:
   * - Middle: previous absorbs this period (prev.end = dep.end)
   * - First (null start): next becomes first (next.start = null)
   * - Last (active): previous becomes active (prev.end = null)
   * - Only: device becomes undeployed
   */
  const handleDelete = useCallback(
    dep => {
      if (!dep) return
      const newChanges = [...pendingChanges]

      const sorted = sortChronological(workingDeployments)
      const idx = sorted.findIndex(d => d.id === dep.id)
      const prev = idx > 0 ? sorted[idx - 1] : null
      const next = idx < sorted.length - 1 ? sorted[idx + 1] : null

      // Remove the deleted deployment
      if (dep.isNew) {
        const addIdx = newChanges.findIndex(c => c.tempId === dep.id && c.action === 'add')
        if (addIdx >= 0) newChanges.splice(addIdx, 1)
      } else {
        newChanges.push({ action: 'delete', id: dep.id })
      }

      // Adjust adjacent deployments
      if (prev && next) {
        // Middle: previous absorbs the deleted period
        applyUpdateChange(newChanges, prev, { end: getDeploymentDateString(dep.end) })
      } else if (!prev && next) {
        // First deployment (null start): next becomes the new first
        applyUpdateChange(newChanges, next, { start: null })
      } else if (prev && !next) {
        // Last (active) deployment: previous becomes the new active
        applyUpdateChange(newChanges, prev, { end: null })
      }
      // If only deployment: no adjacent adjustments, device becomes undeployed

      setPendingChanges(newChanges)
      setDeletingDeployment(null)
    },
    [pendingChanges, workingDeployments]
  )

  const handleSave = useCallback(async () => {
    const validationErrorKey = getDeploymentValidationError(workingDeployments)
    if (validationErrorKey) {
      const message = formatMessage(messages[validationErrorKey])
      setSaveError(message)
      toast.error(message)
      return
    }

    setSaveError(null)
    const changes = pendingChanges.map(c => {
      if (c.action === 'add') return { action: 'add', siteId: c.siteId, start: c.start, end: c.end ?? null }
      if (c.action === 'update')
        return { action: 'update', id: c.id, siteId: c.siteId, start: c.start, end: c.end ?? null }
      if (c.action === 'delete') return { action: 'delete', id: c.id }
      return c
    })

    persistMutation.mutate(
      { deviceId, changes },
      {
        onSuccess: async () => {
          setSaveError(null)
          await refetch()
          setPendingChanges([])
          setPreview(null)
          toast.success(formatMessage(messages.deploymentSaved))
        },
        onError: err => {
          const message = err?.message || formatMessage(messages.deploymentError)
          setSaveError(message)
          toast.error(message)
        },
      }
    )
  }, [pendingChanges, deviceId, persistMutation, formatMessage, refetch, workingDeployments])

  const isChecking = checkResults.isLoading
  const isSaving = persistMutation.isLoading
  const validationErrorKey = useMemo(() => getDeploymentValidationError(workingDeployments), [workingDeployments])
  const canSave = hasPendingChanges && !isChecking && !isSaving && !validationErrorKey

  const columns = [
    { key: 'siteName', label: formatMessage(messages.deploymentSite), sortable: false },
    { key: 'start', label: formatMessage(messages.deploymentStartDate), sortable: false },
    { key: 'end', label: formatMessage(messages.deploymentEndDate), sortable: false },
    ...(!disabled ? [{ key: 'actions', label: '' }] : []),
  ]

  const hasPreviewMoves = preview?.moves?.some(m => m.resultCount > 0)

  // Compute the delete confirmation message based on position in the timeline
  const deleteConfirmMessage = useMemo(() => {
    if (!deletingDeployment) return null
    const sorted = sortChronological(workingDeployments)
    const idx = sorted.findIndex(d => d.id === deletingDeployment.id)
    const prev = idx > 0 ? sorted[idx - 1] : null
    const next = idx < sorted.length - 1 ? sorted[idx + 1] : null

    if (!prev && !next) {
      return formatMessage(messages.deploymentDeleteOnly)
    }
    if (!prev && next) {
      return formatMessage(messages.deploymentDeleteFirst, {
        nextSite: next.siteName || `Site #${next.siteId}`,
      })
    }
    if (prev && !next) {
      return formatMessage(messages.deploymentDeleteLast, {
        prevSite: prev.siteName || `Site #${prev.siteId}`,
      })
    }
    return formatMessage(messages.deploymentDeleteMiddle, {
      prevSite: prev.siteName || `Site #${prev.siteId}`,
      date: getDeploymentDateString(deletingDeployment.end) || '—',
    })
  }, [deletingDeployment, workingDeployments, formatMessage])

  // Find the previous deployment for the edit dialog warning
  const editingPreviousDeployment = useMemo(() => {
    if (!editingDeployment) return null
    const sorted = sortChronological(workingDeployments)
    const idx = sorted.findIndex(d => d.id === editingDeployment.id)
    return idx > 0 ? sorted[idx - 1] : null
  }, [editingDeployment, workingDeployments])

  return (
    <section className={styles.Section}>
      <Card className={styles.Section}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <p data-panel-title>{formatMessage(messages.deploymentsTitle)}</p>
          {!disabled && (
            <Box display="flex" gap={1}>
              <PermissionChecker permissions={['device:edit']}>
                <AspectButton color="primary" variant="contained" inverse onClick={() => setAddDialogOpen(true)}>
                  {formatMessage(messages.addDeployment)}
                </AspectButton>
                {hasPendingChanges && (
                  <AspectButton color="primary" variant="contained" onClick={handleSave} disabled={!canSave}>
                    {isChecking ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : (
                      formatMessage(messages.saveDeployments)
                    )}
                  </AspectButton>
                )}
              </PermissionChecker>
            </Box>
          )}
        </Box>

        {(saveError || (hasPendingChanges && validationErrorKey)) && (
          <Alert
            severity="error"
            sx={{ mx: 2, mt: 1 }}
            onClose={validationErrorKey ? undefined : () => setSaveError(null)}
          >
            {saveError || (validationErrorKey ? formatMessage(messages[validationErrorKey]) : null)}
          </Alert>
        )}

        {isLoading ? (
          <Box display="flex" justifyContent="center" padding={2}>
            <CircularProgress />
          </Box>
        ) : workingDeployments.length === 0 ? (
          <p style={{ padding: '20px', textAlign: 'center' }}>{formatMessage(messages.noDeployments)}</p>
        ) : (
          <>
            {!activeDeployment && (
              <Alert severity="info" sx={{ mx: 2, mb: 1 }}>
                {formatMessage(messages.deviceUndeployed)}
              </Alert>
            )}
            <TableContainer>
              <Table className={styles.ResultDataTable} size="small">
                <DataTableHead columns={columns} />
                <TableBody>
                  {workingDeployments.map((dep, index) => {
                    const isPending = dep.status === 'pending'
                    const isActive = !dep.end
                    const isFirst = dep.start === null

                    return (
                      <TableRow
                        key={dep.id}
                        sx={{
                          bgcolor: index % 2 ? '#fff' : '#eef1f8',
                          color: isPending ? '#888' : 'inherit',
                        }}
                      >
                        <TableCell>{dep.siteName || '—'}</TableCell>
                        <TableCell>
                          {isFirst
                            ? formatMessage(messages.deploymentFromBeginning)
                            : getDeploymentDateString(dep.start)}
                        </TableCell>
                        <TableCell>
                          {isActive ? formatMessage(messages.deploymentActive) : getDeploymentDateString(dep.end)}
                        </TableCell>
                        {!disabled && (
                          <TableCell align="right">
                            <PermissionChecker permissions={['device:edit']}>
                              <AspectVertMenu
                                actions={[
                                  {
                                    icon: 'FaEdit',
                                    text: formatMessage(messages.editDeployment),
                                    action: () => setEditingDeployment(dep),
                                  },
                                  {
                                    icon: 'FaTrash',
                                    text: formatMessage(messages.deleteDeployment),
                                    action: () => setDeletingDeployment(dep),
                                  },
                                ]}
                              />
                            </PermissionChecker>
                          </TableCell>
                        )}
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}

        {/* Preview warnings for result site changes */}
        {hasPendingChanges && hasPreviewMoves && (
          <Box padding={2}>
            {preview?.moves
              ?.filter(m => m.resultCount > 0)
              .map(m => (
                <Alert key={m.siteId} severity="warning" sx={{ mb: 1 }}>
                  {formatMessage(messages.resultsWillBeMoved, {
                    count: m.resultCount,
                    siteName: m.siteName || `Site #${m.siteId}`,
                  })}
                </Alert>
              ))}
          </Box>
        )}

        {isChecking && hasPendingChanges && (
          <Box display="flex" justifyContent="center" padding={1}>
            <CircularProgress size={20} />
          </Box>
        )}
      </Card>

      <AddDeploymentDialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        onConfirm={({ siteId, siteName, start }) => {
          const applied = handleAddDeployment({ siteId, start, siteName })
          if (applied) setAddDialogOpen(false)
          return applied
        }}
        activeDeployment={activeDeployment}
      />

      {editingDeployment && (
        <EditDeploymentDialog
          open={!!editingDeployment}
          onClose={() => setEditingDeployment(null)}
          onConfirm={handleEditDeployment}
          deployment={editingDeployment}
          previousDeployment={editingPreviousDeployment}
        />
      )}

      {/* Delete confirmation */}
      <Dialog open={!!deletingDeployment} onClose={() => setDeletingDeployment(null)}>
        <DialogTitle>{formatMessage(messages.deleteDeployment)}</DialogTitle>
        <DialogContent>
          <DialogContentText>{deleteConfirmMessage}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <AspectButton onClick={() => setDeletingDeployment(null)}>{formatMessage(messages.cancel)}</AspectButton>
          <AspectButton color="primary" variant="contained" onClick={() => handleDelete(deletingDeployment)}>
            {formatMessage(messages.confirm)}
          </AspectButton>
        </DialogActions>
      </Dialog>
    </section>
  )
}

DeploymentsSection.propTypes = {
  deviceId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  disabled: PropTypes.bool,
}

DeploymentsSection.defaultProps = {
  disabled: false,
}

export default DeploymentsSection
