import React from 'react'
import { Box, Card, CardContent, Chip, LinearProgress, Link, Typography } from '@mui/material'
import { Helmet } from 'react-helmet'
import { useIntl } from 'react-intl'
import { useQuery } from 'react-query'
import { Link as RouterLink, useParams } from 'react-router-dom'
import { DetailHeader } from '../../../../components'
import fetchWrapperForQueries from '../../../../components/QueryFetch'
import { FORM_DATA_DETAIL } from '../../../../components/QueryFetch/FormData'
import allMessages from '../../../../messages/allMessages'
import { formatDate, formatDateTime } from '../../../../utils/utils/dateFormat'
import messages from '../messages'
import styles from '../TruenatCustomFields.module.css'

const LabeledField = ({ label, children }) => (
  <Box sx={{ mb: 4 }}>
    <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.25, color: '#2f6467' }}>
      {label}
    </Typography>
    <Typography variant="body1">{children}</Typography>
  </Box>
)

const TruenatCustomFieldsDetail = () => {
  const { formatMessage } = useIntl()
  const { id } = useParams()

  const { data, isLoading } = useQuery([FORM_DATA_DETAIL.KEY, id], () =>
    fetchWrapperForQueries({ endpoint: `${FORM_DATA_DETAIL.ENDPOINT}/${id}` })
  )

  const entry = data?.data
  const formFields = entry?.formFields || []

  return (
    <>
      <DetailHeader name={formatMessage(messages.detailTitle)} />
      <Box sx={{ p: '10px', width: '100%' }}>
        <Helmet title={formatMessage(messages.detailTitle)} />
        {isLoading ? (
          <LinearProgress />
        ) : (
          <>
            {/* Header card: audit / link info */}
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: 2,
                  }}
                >
                  <LabeledField label={formatMessage(messages.siteName)}>{entry?.siteName || '-'}</LabeledField>
                  <LabeledField label={formatMessage(messages.sampleId)}>{entry?.sampleExternalId || '-'}</LabeledField>
                  <LabeledField label={formatMessage(messages.matchToResult)}>
                    {entry?.resultId ? (
                      <Link component={RouterLink} to={`/browse/result/${entry.resultId}`}>
                        {formatMessage(allMessages.matched)}
                      </Link>
                    ) : (
                      <Chip label={formatMessage(allMessages.noMatch)} color="error" size="small" />
                    )}
                  </LabeledField>
                  <LabeledField label={formatMessage(messages.resultEndedOn)}>
                    {entry?.resultEndedOn ? formatDate(entry.resultEndedOn) : '-'}
                  </LabeledField>
                  <LabeledField label={formatMessage(messages.dateOfTest)}>
                    {formatDate(entry?.collectedOn)}
                  </LabeledField>
                  <LabeledField label={formatMessage(messages.dateUploaded)}>
                    {formatDateTime(entry?.createdOn)}
                  </LabeledField>
                  <LabeledField label={formatMessage(messages.updatedOn)}>
                    {formatDateTime(entry?.updatedOn)}
                  </LabeledField>
                </Box>
              </CardContent>
            </Card>

            {/* Custom fields card */}
            {formFields.length > 0 && (
              <Card>
                <CardContent>
                  <Typography component="p" className={styles.PanelTitle} sx={{ mb: 3 }}>
                    {formatMessage(messages.customFieldsSectionTitle)}
                  </Typography>
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, 1fr)',
                      gap: '16px 48px',
                    }}
                  >
                    {formFields.map(field => (
                      <LabeledField key={field.id} label={field.title}>
                        {field.value != null && field.value !== '' ? String(field.value) : '-'}
                      </LabeledField>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </Box>
    </>
  )
}

export default TruenatCustomFieldsDetail
