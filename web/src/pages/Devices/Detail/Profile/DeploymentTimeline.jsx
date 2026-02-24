import React, { useMemo } from 'react'
import { Box, Tooltip, Typography } from '@mui/material'
import PropTypes from 'prop-types'
import { useIntl } from 'react-intl'

/** Share of total timeline width used for the left fade on the first segment (estimated start). Fixed so it looks the same regardless of segment duration. */
const LEFT_FADE_PCT_OF_TIMELINE = 3

/** Min distance (as share of timeline width) between two boundary labels before we displace one down to avoid overlap. */
const MIN_LABEL_DISTANCE_PCT = 0.1

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

/** Format YYYY-MM-DD (or date string) as localized year and month for display (uses locale for translations). */
function toYearMonth(dateStr, locale) {
  if (!dateStr || typeof dateStr !== 'string') return dateStr
  const m = dateStr.match(/^(\d{4})-(\d{2})/)
  if (!m) return dateStr
  const year = parseInt(m[1], 10)
  const month = parseInt(m[2], 10) - 1
  const date = new Date(year, month, 1)
  try {
    return new Intl.DateTimeFormat(locale, { month: 'short', year: 'numeric' }).format(date)
  } catch {
    return dateStr
  }
}

const DeploymentTimeline = ({ deployments, firstResultDate, palette, ariaLabel, messageActive }) => {
  const { formatMessage } = useIntl()

  // Chronological order (oldest first) for timeline and color index
  const chronologicalDeployments = useMemo(
    () => (deployments?.length ? sortChronological(deployments) : []),
    [deployments]
  )

  // Same site => same color (by first appearance in chronological order)
  const siteToColorIndex = useMemo(() => {
    const map = {}
    let nextIndex = 0
    chronologicalDeployments.forEach(dep => {
      const key = dep.siteId != null ? dep.siteId : `temp-${dep.id}`
      if (map[key] === undefined) {
        nextIndex += 1
        map[key] = nextIndex
      }
    })
    return map
  }, [chronologicalDeployments])

  // Timeline range and segment widths; null when timeline should be hidden
  const timelineData = useMemo(() => {
    if (chronologicalDeployments.length === 0) return null
    const first = chronologicalDeployments[0]
    const last = chronologicalDeployments[chronologicalDeployments.length - 1]
    const todayStr = new Date().toISOString().slice(0, 10)

    const rangeStart =
      first.start === null
        ? firstResultDate != null
          ? typeof firstResultDate === 'string' && /^\d{4}-\d{2}-\d{2}/.test(firstResultDate)
            ? firstResultDate.slice(0, 10)
            : new Date(firstResultDate).toISOString().slice(0, 10)
          : null
        : getDeploymentDateString(first.start)

    const rangeEnd = last.end === null ? todayStr : getDeploymentDateString(last.end)

    if (rangeStart == null || rangeEnd == null) return null

    const rangeStartMs = new Date(`${rangeStart}T12:00:00Z`).getTime()
    const rangeEndMs = new Date(`${rangeEnd}T12:00:00Z`).getTime()
    const totalMs = Math.max(1, rangeEndMs - rangeStartMs)

    const segments = chronologicalDeployments.map((dep, i) => {
      const segStartStr = i === 0 && dep.start === null ? rangeStart : getDeploymentDateString(dep.start)
      const segEndStr =
        i === chronologicalDeployments.length - 1 && !dep.end ? rangeEnd : getDeploymentDateString(dep.end)
      const segStartMs = new Date(`${segStartStr}T12:00:00Z`).getTime()
      const segEndMs = new Date(`${segEndStr}T12:00:00Z`).getTime()
      const widthPct = Math.max(2, ((segEndMs - segStartMs) / totalMs) * 100)
      const siteKey = dep.siteId != null ? dep.siteId : `temp-${dep.id}`
      return {
        deployment: dep,
        widthPct,
        startStr: segStartStr,
        endStr: segEndStr,
        isFirst: dep.start === null,
        isActive: !dep.end,
        colorIndex: siteToColorIndex[siteKey] ?? 0,
      }
    })

    const totalPct = segments.reduce((s, seg) => s + seg.widthPct, 0)
    const scale = totalPct > 0 ? 100 / totalPct : 1
    segments.forEach(seg => {
      seg.widthPct *= scale
    })

    const boundaryPcts = [0]
    let cum = 0
    segments.forEach(seg => {
      cum += seg.widthPct
      boundaryPcts.push(cum)
    })
    const boundaryLabels = [
      first.start === null ? '' : rangeStart,
      ...segments.map(seg => (seg.isActive ? 'Active' : seg.endStr)),
    ]

    return { segments, boundaryPcts, boundaryLabels }
  }, [chronologicalDeployments, firstResultDate, siteToColorIndex])

  const shiftLabelDown = useMemo(() => {
    if (!timelineData?.boundaryPcts?.length) return []
    const out = timelineData.boundaryPcts.map(() => false)
    for (let i = 1; i < timelineData.boundaryPcts.length; i++) {
      if (timelineData.boundaryPcts[i] - timelineData.boundaryPcts[i - 1] < MIN_LABEL_DISTANCE_PCT) {
        out[i] = true
      }
    }
    return out
  }, [timelineData])

  if (!timelineData || timelineData.segments.length === 0) return null

  const { segments, boundaryPcts, boundaryLabels } = timelineData
  const firstSegmentPct = segments.length > 0 ? segments[0].widthPct : 0
  const fadePctInsideFirstSegment = firstSegmentPct > 0 ? (LEFT_FADE_PCT_OF_TIMELINE / firstSegmentPct) * 100 : 0

  return (
    <>
      <Typography variant="caption" sx={{ display: 'block', mb: 0.5, color: 'text.secondary' }}>
        {ariaLabel}
      </Typography>
      {/* Site names above the bar when segment is wide enough */}
      <Box display="flex" sx={{ height: 20, mb: 0.25 }}>
        {segments.map(seg => {
          const showSiteName = seg.widthPct >= 18
          return (
            <Box
              key={seg.deployment.id}
              sx={{
                width: `${seg.widthPct}%`,
                minWidth: 4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                px: 0.5,
              }}
            >
              {showSiteName && (
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: '0.7rem',
                    fontWeight: 500,
                    color: 'text.secondary',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '100%',
                  }}
                >
                  {seg.deployment.siteName || '—'}
                </Typography>
              )}
            </Box>
          )
        })}
      </Box>
      {/* Colored bar with tooltips; first segment has left fade for estimated start */}
      <Box
        display="flex"
        role="img"
        aria-label={ariaLabel}
        sx={{
          height: 28,
          borderRadius: 1,
          overflow: 'hidden',
          bgcolor: 'action.hover',
        }}
      >
        {segments.map(seg => {
          const siteName = seg.deployment.siteName || '—'
          const endLabel = seg.isActive ? formatMessage(messageActive) : seg.endStr
          const tooltipText = seg.isFirst ? `${siteName}: ${endLabel}` : `${siteName}: ${seg.startStr} – ${endLabel}`
          const colorIndex = seg.colorIndex ?? 0
          const color = palette[colorIndex % palette.length]
          const isFirstWithFade = seg.isFirst && firstSegmentPct > 0 && fadePctInsideFirstSegment < 100
          const bg = isFirstWithFade
            ? `linear-gradient(to right, transparent 0%, ${color} ${fadePctInsideFirstSegment}%, ${color} 100%)`
            : color

          return (
            <Tooltip key={seg.deployment.id} title={tooltipText} placement="top">
              <Box
                sx={{
                  width: `${seg.widthPct}%`,
                  minWidth: 4,
                  background: bg,
                  transition: 'opacity 0.15s',
                  '&:hover': { opacity: 0.9 },
                }}
                aria-label={tooltipText}
              />
            </Tooltip>
          )
        })}
      </Box>
      {/* Boundary markers: year-month in labels, full date in tooltips; displace close labels down */}
      <Box sx={{ position: 'relative', height: 48, mt: 0.25 }}>
        {boundaryPcts.map((pct, i) => {
          const fullLabel = boundaryLabels[i]
          const displayLabel =
            fullLabel === '' ? '' : fullLabel === 'Active' ? formatMessage(messageActive) : toYearMonth(fullLabel)
          const tooltipTitle = fullLabel === '' ? '' : fullLabel === 'Active' ? formatMessage(messageActive) : fullLabel
          return (
            <Box
              key={i}
              sx={{
                position: 'absolute',
                left: `${pct}%`,
                transform: 'translateX(-50%)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                minWidth: 0,
              }}
            >
              <Box
                sx={{
                  width: 2,
                  height: 6,
                  borderRadius: 1,
                  bgcolor: 'grey.500',
                  flexShrink: 0,
                }}
              />
              {displayLabel !== '' && (
                <Tooltip title={tooltipTitle} placement="top">
                  <Typography
                    variant="caption"
                    sx={{
                      fontSize: '0.65rem',
                      color: 'text.secondary',
                      whiteSpace: 'nowrap',
                      mt: 0.25,
                      maxWidth: 80,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      ...(shiftLabelDown[i] ? { mt: 2.5 } : {}),
                    }}
                  >
                    {displayLabel}
                  </Typography>
                </Tooltip>
              )}
            </Box>
          )
        })}
      </Box>
    </>
  )
}

DeploymentTimeline.propTypes = {
  deployments: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      siteId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      siteName: PropTypes.string,
      start: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
      end: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    })
  ).isRequired,
  firstResultDate: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
  palette: PropTypes.arrayOf(PropTypes.string).isRequired,
  ariaLabel: PropTypes.string.isRequired,
  messageActive: PropTypes.object.isRequired,
}

DeploymentTimeline.defaultProps = {
  firstResultDate: null,
}

export default DeploymentTimeline
