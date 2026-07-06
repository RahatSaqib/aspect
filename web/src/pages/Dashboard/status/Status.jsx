import React from 'react'
import { Helmet } from 'react-helmet'
import { useIntl } from 'react-intl'
import {
  CovidResultGraph,
  DeviceStatusGraph,
  ErrorBoundary,
  HivResultsGraph,
  InventoryStatusGraph,
  TbDetectedGraph,
  TbRifDetectedGraph,
  TestsOverTimeGraph,
  TreatmentStatusGraph,
  XDRFLQResistanceGraph,
} from '../../../components'
import LazyGraph from '../../../components/LazyGraph'
import PermissionChecker from '../../../components/PermissionChecker'
import useAssayList from '../../../hooks/assay/useAssayList'
import useResultCategoryGroup from '../../../hooks/result/useResultCategoryGroup'
import useAuthState from '../../../hooks/useAuthState'
import styles from './index.module.css'
import messages from './messages'
import SummaryStatus from './SummaryStatus'

const tbPermissions = ['GxMtbRif', 'GxMtbRifUltra']
const xdrPermissions = ['GxMtbXdr']
const hivPermissions = [
  'abbottM2000DBSHivVL',
  'abbottM2000PlasmaHivVL',
  'assayAlereQHiv12Detect',
  'assayAlereQHiv12VLPlasma',
  'assayCobasHivVl',
  'GxHiv1Vl',
  'QHivVL',
  'ReporterHivVL',
]
const covidPermissions = ['assayGXCovid19', 'assayMP96Covid19', 'assayQS7Covid19', 'assayGenericCovid19']

const Status = () => {
  const { formatMessage } = useIntl()
  const { isCountry } = useAuthState()
  const { data: assays } = useAssayList()
  const { data: resultCategoryGroups } = useResultCategoryGroup(assays?.map(x => x.id))
  return (
    <div className={styles.Container}>
      <Helmet title={formatMessage(messages.statusTitle)} />

      <PermissionChecker permissions={['dashboard']}>
        <ErrorBoundary>
          <SummaryStatus className={styles.Section__summary} dashboard="home" />
        </ErrorBoundary>
      </PermissionChecker>

      {assays ? (
        <div className={styles.wrapper}>
          <LazyGraph>
            <PermissionChecker permissions={['dashboard']}>
              <ErrorBoundary>
                <TestsOverTimeGraph assaysFromState={assays} /> {/*  1  */}
              </ErrorBoundary>
            </PermissionChecker>
          </LazyGraph>

          {assays.some(a => tbPermissions.includes(a.externalId)) ? (
            <>
              <LazyGraph>
                <PermissionChecker permissions={['dashboard']}>
                  <ErrorBoundary>
                    <TbDetectedGraph assaysFromState={assays} resultCategoryGroupsFromState={resultCategoryGroups} />{' '}
                    {/* 2 */}
                  </ErrorBoundary>
                </PermissionChecker>
              </LazyGraph>
              <LazyGraph>
                <PermissionChecker permissions={['dashboard']}>
                  <ErrorBoundary>
                    <TbRifDetectedGraph assaysFromState={assays} resultCategoryGroupsFromState={resultCategoryGroups} />{' '}
                    {/* 3 */}
                  </ErrorBoundary>
                </PermissionChecker>
              </LazyGraph>
            </>
          ) : null}

          {assays.some(a => xdrPermissions.includes(a.externalId)) ? (
            <LazyGraph>
              <PermissionChecker permissions={['dashboard']}>
                <ErrorBoundary>
                  <XDRFLQResistanceGraph /> {/* 4 */}
                </ErrorBoundary>
              </PermissionChecker>
            </LazyGraph>
          ) : null}

          {assays.some(a => covidPermissions.includes(a.externalId)) && !isCountry('BD') ? (
            <LazyGraph>
              <PermissionChecker permissions={['dashboard']}>
                <ErrorBoundary>
                  <CovidResultGraph assaysFromState={assays} resultCategoryGroupsFromState={resultCategoryGroups} />{' '}
                  {/* 11 */}
                </ErrorBoundary>
              </PermissionChecker>
            </LazyGraph>
          ) : null}

          {assays.some(a => hivPermissions.includes(a.externalId)) ? (
            <LazyGraph>
              <PermissionChecker permissions={['dashboard']}>
                <ErrorBoundary>
                  <HivResultsGraph assaysFromState={assays} resultCategoryGroupsFromState={resultCategoryGroups} />{' '}
                  {/* 12 */}
                </ErrorBoundary>
              </PermissionChecker>
            </LazyGraph>
          ) : null}

          {!isCountry('BD') ? (
            <LazyGraph>
              <PermissionChecker permissions={['dashboard', 'operationalData']}>
                <ErrorBoundary>
                  <DeviceStatusGraph assaysFromState={assays} /> {/* 13 */}
                </ErrorBoundary>
              </PermissionChecker>
            </LazyGraph>
          ) : null}
          <LazyGraph>
            <PermissionChecker permissions={['dashboard', 'operationalData']}>
              <ErrorBoundary>
                <InventoryStatusGraph assaysFromState={assays} /> {/* 14 */}
              </ErrorBoundary>
            </PermissionChecker>
          </LazyGraph>

          {assays.some(a => hivPermissions.includes(a.externalId)) ? (
            <LazyGraph>
              <PermissionChecker permissions={['dashboard', '+reporter']}>
                <ErrorBoundary>
                  <TreatmentStatusGraph assaysFromState={assays} /> {/* 15 */}
                </ErrorBoundary>
              </PermissionChecker>
            </LazyGraph>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

export default Status
