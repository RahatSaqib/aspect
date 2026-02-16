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
import FillGapDeploymentDialog from './FillGapDeploymentDialog'
import FinishDeploymentDialog from './FinishDeploymentDialog'
import messages from './messages'

const formatDate = dateStr => {
  if (!dateStr) return null
  const d = new Date(dateStr)
  return d.toISOString().slice(0, 10)
}

/**
 * Validates that deployments don't overlap, any open deployment is last, and no end before start.
 * Same-day deployments (start === end) are allowed.
 * Returns a message key (for formatMessage(messages[key])) or null if valid.
 */
function getDeploymentValidationError(deployments) {
  if (!deployments || deployments.length === 0) return null
  const sorted = [...deployments].sort((a, b) => new Date(a.start) - new Date(b.start))
  for (const d of sorted) {
    if (d.end) {
      const start = new Date(d.start)
      const end = new Date(d.end)
      if (end < start) return 'deploymentOverlap'
    }
  }
  if (sorted.length <= 1) return null
  for (let i = 0; i < sorted.length - 1; i++) {
    const current = sorted[i]
    const next = sorted[i + 1]
    if (!current.end) {
      return 'deploymentOpenMustBeLast'
    }
    const currentEnd = new Date(current.end)
    const nextStart = new Date(next.start)
    if (currentEnd >= nextStart) {
      return 'deploymentOverlap'
    }
  }
  return null
}

const DeploymentsSection = ({ deviceId, disabled }) => {
  const { formatMessage } = useIntl()
  const { data: serverDeployments = [], isLoading, refetch } = useDeployments(deviceId)
  const checkResults = useCheckDeploymentResults()
  const persistMutation = usePersistDeployments()

  // Local state for pending changes
  const [pendingChanges, setPendingChanges] = useState([])
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [finishDialogOpen, setFinishDialogOpen] = useState(false)
  const [editingDeployment, setEditingDeployment] = useState(null)
  const [deletingDeployment, setDeletingDeployment] = useState(null)
  const [preview, setPreview] = useState(null)
  const [saveError, setSaveError] = useState(null)
  const [gapToFill, setGapToFill] = useState(null)

  const hasPendingChanges = pendingChanges.length > 0

  // Compute the "working" deployment list by applying pending changes to server data
  const workingDeployments = useMemo(() => {
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
          end: change.end || null,
          status: 'pending',
          isNew: true,
        })
      }
    }

    // Sort by start date descending
    result.sort((a, b) => new Date(b.start) - new Date(a.start))
    return result
  }, [serverDeployments, pendingChanges])

  const activeDeployment = useMemo(() => workingDeployments.find(d => !d.end), [workingDeployments])

  // Build display list with phantom "undeployed" rows for inner gaps
  const displayRows = useMemo(() => {
    if (workingDeployments.length <= 1) return workingDeployments.map(d => ({ ...d, type: 'deployment' }))

    // Work with ascending order for gap detection
    const sorted = [...workingDeployments].sort((a, b) => new Date(a.start) - new Date(b.start))
    const rows = []

    for (let i = 0; i < sorted.length; i++) {
      rows.push({ ...sorted[i], type: 'deployment' })

      // Only insert gap rows between inner deployments (not after last)
      if (i < sorted.length - 1 && sorted[i].end) {
        const gapStart = new Date(sorted[i].end)
        gapStart.setDate(gapStart.getDate() + 1)
        const gapEnd = new Date(sorted[i + 1].start)
        gapEnd.setDate(gapEnd.getDate() - 1)

        if (gapStart <= gapEnd) {
          rows.push({
            type: 'gap',
            gapId: `gap-${i}`,
            start: gapStart.toISOString().slice(0, 10),
            end: gapEnd.toISOString().slice(0, 10),
          })
        }
      }
    }

    // Return in descending order (most recent first)
    rows.reverse()
    return rows
  }, [workingDeployments])

  // Run check-results whenever pending changes change
  useEffect(() => {
    if (!hasPendingChanges) {
      setPreview(null)
      return
    }

    const proposedDeployments = workingDeployments.map(d => ({
      siteId: d.siteId,
      start: formatDate(d.start),
      end: d.end ? formatDate(d.end) : null,
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

  const handleAddDeployment = useCallback(
    ({ siteId, start, siteName }) => {
      const newStart = typeof start === 'string' ? start : new Date(start).toISOString().slice(0, 10)

      // If there's an active deployment, we close it so the new one can start. End must be >= start (no inconsistent span).
      let closedEndDate = null
      if (activeDeployment) {
        const dayBefore = new Date(newStart)
        dayBefore.setDate(dayBefore.getDate() - 1)
        const dayBeforeStr = dayBefore.toISOString().slice(0, 10)
        const activeStartStr = formatDate(activeDeployment.start)
        // Ensure we never set end before start: end = max(active.start, day before new start)
        const activeStartDate = new Date(activeStartStr)
        const dayBeforeDate = new Date(dayBeforeStr)
        closedEndDate = activeStartDate > dayBeforeDate ? activeStartStr : dayBeforeStr
        // New deployment must start after the closed period to avoid overlap
        if (new Date(newStart) <= new Date(closedEndDate)) {
          const minStart = new Date(closedEndDate)
          minStart.setDate(minStart.getDate() + 1)
          const minStartStr = minStart.toISOString().slice(0, 10)
          toast.error(formatMessage(messages.deploymentNewStartAfterCurrentEnd, { minStartDate: minStartStr }))
          return false
        }
      }

      const newChanges = [...pendingChanges]

      if (activeDeployment) {
        const endDate = closedEndDate
        if (activeDeployment.isNew) {
          newChanges.forEach(c => {
            if (c.tempId === activeDeployment.id && c.action === 'add') {
              c.end = endDate
            }
          })
        } else {
          newChanges.push({
            action: 'update',
            id: activeDeployment.id,
            siteId: activeDeployment.siteId,
            siteName: activeDeployment.siteName,
            start: formatDate(activeDeployment.start),
            end: endDate,
          })
        }
      }

      newChanges.push({
        action: 'add',
        tempId: `temp-${Date.now()}`,
        siteId,
        siteName,
        start: newStart,
        end: null,
      })

      setPendingChanges(newChanges)
      return true
    },
    [pendingChanges, activeDeployment, formatMessage]
  )

  const handleFinishDeployment = useCallback(
    ({ end }) => {
      if (!activeDeployment) return

      const newChanges = [...pendingChanges]

      if (activeDeployment.isNew) {
        newChanges.forEach(c => {
          if (c.tempId === activeDeployment.id && c.action === 'add') {
            c.end = formatDate(end)
          }
        })
      } else {
        newChanges.push({
          action: 'update',
          id: activeDeployment.id,
          siteId: activeDeployment.siteId,
          siteName: activeDeployment.siteName,
          start: formatDate(activeDeployment.start),
          end: formatDate(end),
        })
      }

      setPendingChanges(newChanges)
      setFinishDialogOpen(false)
    },
    [pendingChanges, activeDeployment]
  )

  const handleAddDeploymentInGap = useCallback(({ siteId, siteName, start, end }) => {
    setPendingChanges(prev => [
      ...prev,
      {
        action: 'add',
        tempId: `temp-${Date.now()}`,
        siteId,
        siteName,
        start: formatDate(start),
        end: formatDate(end),
      },
    ])
    setGapToFill(null)
  }, [])

  const handleEditDeployment = useCallback(
    ({ start, end }) => {
      if (!editingDeployment) return

      const newChanges = [...pendingChanges]
      const dep = editingDeployment

      if (dep.isNew) {
        newChanges.forEach(c => {
          if (c.tempId === dep.id && c.action === 'add') {
            c.start = formatDate(start)
            c.end = end ? formatDate(end) : null
          }
        })
      } else {
        // Check if there's already an update change for this deployment
        const existingIdx = newChanges.findIndex(c => c.id === dep.id && c.action === 'update')
        const updateChange = {
          action: 'update',
          id: dep.id,
          siteId: dep.siteId,
          siteName: dep.siteName,
          start: formatDate(start),
          end: end ? formatDate(end) : null,
        }
        if (existingIdx >= 0) {
          newChanges[existingIdx] = updateChange
        } else {
          newChanges.push(updateChange)
        }
      }

      setPendingChanges(newChanges)
      setEditingDeployment(null)
    },
    [pendingChanges, editingDeployment]
  )

  const handleDelete = useCallback(
    dep => {
      if (!dep) return

      const newChanges = [...pendingChanges]

      if (dep.isNew) {
        const idx = newChanges.findIndex(c => c.tempId === dep.id && c.action === 'add')
        if (idx >= 0) newChanges.splice(idx, 1)
      } else {
        newChanges.push({
          action: 'delete',
          id: dep.id,
        })
      }

      setPendingChanges(newChanges)
      setDeletingDeployment(null)
    },
    [pendingChanges]
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
      if (c.action === 'add') {
        return { action: 'add', siteId: c.siteId, start: c.start, end: c.end || null }
      }
      if (c.action === 'update') {
        return { action: 'update', id: c.id, siteId: c.siteId, start: c.start, end: c.end || null }
      }
      if (c.action === 'delete') {
        return { action: 'delete', id: c.id }
      }
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
  const canSave = hasPendingChanges && !isChecking && !isSaving

  const columns = [
    { key: 'siteName', label: formatMessage(messages.deploymentSite), sortable: false },
    { key: 'start', label: formatMessage(messages.deploymentStartDate), sortable: false },
    { key: 'end', label: formatMessage(messages.deploymentEndDate), sortable: false },
    ...(!disabled ? [{ key: 'actions', label: '' }] : []),
  ]

  const hasPreviewMoves = preview?.moves?.some(m => m.resultCount > 0)
  const hasPreviewGaps = preview?.gaps?.some(g => g.resultCount > 0)

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

        {saveError && (
          <Alert severity="error" sx={{ mx: 2, mt: 1 }} onClose={() => setSaveError(null)}>
            {saveError}
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
                  {displayRows.map((row, index) => {
                    if (row.type === 'gap') {
                      return (
                        <TableRow key={row.gapId} sx={{ bgcolor: '#f5f5f5' }}>
                          <TableCell sx={{ color: '#888', fontStyle: 'italic' }}>
                            {formatMessage(messages.undeployedPeriod)}
                          </TableCell>
                          <TableCell sx={{ color: '#888', fontStyle: 'italic' }}>{row.start}</TableCell>
                          <TableCell sx={{ color: '#888', fontStyle: 'italic' }}>{row.end}</TableCell>
                          {!disabled && (
                            <TableCell align="right">
                              <PermissionChecker permissions={['device:edit']}>
                                <AspectVertMenu
                                  actions={[
                                    {
                                      icon: 'FaPlus',
                                      text: formatMessage(messages.addDeployment),
                                      action: () => setGapToFill({ start: row.start, end: row.end }),
                                    },
                                  ]}
                                />
                              </PermissionChecker>
                            </TableCell>
                          )}
                        </TableRow>
                      )
                    }

                    const dep = row
                    const isPending = dep.status === 'pending'
                    const isActive = !dep.end

                    return (
                      <TableRow
                        key={dep.id}
                        sx={{
                          bgcolor: index % 2 ? '#fff' : '#eef1f8',
                          color: isPending ? '#888' : 'inherit',
                        }}
                      >
                        <TableCell>{dep.siteName || '—'}</TableCell>
                        <TableCell>{formatDate(dep.start)}</TableCell>
                        <TableCell>
                          {dep.end ? formatDate(dep.end) : formatMessage(messages.deploymentActive)}
                        </TableCell>
                        {!disabled && (
                          <TableCell align="right">
                            <PermissionChecker permissions={['device:edit']}>
                              <AspectVertMenu
                                actions={[
                                  ...(isActive
                                    ? [
                                        {
                                          icon: 'FaCalendarCheck',
                                          text: formatMessage(messages.finishDeployment),
                                          action: () => setFinishDialogOpen(true),
                                        },
                                      ]
                                    : []),
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

        {/* Preview warnings for result moves and gaps with results */}
        {hasPendingChanges && (hasPreviewMoves || hasPreviewGaps) && (
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
            {preview?.gaps
              ?.filter(g => g.resultCount > 0)
              .map((g, i) => (
                <Alert key={`gap-${i}`} severity="warning" sx={{ mb: 1 }}>
                  {formatMessage(messages.resultsWillLoseSite, {
                    count: g.resultCount,
                    start: g.start || '—',
                    end: g.end || '—',
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

      {/* Dialogs */}
      <AddDeploymentDialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        onConfirm={({ siteId, siteName, start }) => {
          const applied = handleAddDeployment({ siteId, start, siteName })
          if (applied) setAddDialogOpen(false)
          return applied
        }}
        excludeSiteId={activeDeployment?.siteId}
      />

      <FinishDeploymentDialog
        open={finishDialogOpen}
        onClose={() => setFinishDialogOpen(false)}
        onConfirm={handleFinishDeployment}
        startDate={activeDeployment?.start}
      />

      <FillGapDeploymentDialog
        open={!!gapToFill}
        onClose={() => setGapToFill(null)}
        onConfirm={handleAddDeploymentInGap}
        gap={gapToFill}
      />

      {editingDeployment && (
        <EditDeploymentDialog
          open={!!editingDeployment}
          onClose={() => setEditingDeployment(null)}
          onConfirm={handleEditDeployment}
          deployment={editingDeployment}
          hasOtherActiveDeployment={!!(activeDeployment && activeDeployment.id !== editingDeployment.id)}
          otherDeployments={workingDeployments.filter(d => d.id !== editingDeployment.id)}
        />
      )}

      {/* Delete confirmation */}
      <Dialog open={!!deletingDeployment} onClose={() => setDeletingDeployment(null)}>
        <DialogTitle>{formatMessage(messages.deleteDeployment)}</DialogTitle>
        <DialogContent>
          <DialogContentText>{formatMessage(messages.confirmDeleteDeployment)}</DialogContentText>
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
