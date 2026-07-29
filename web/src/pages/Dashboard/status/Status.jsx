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
      <Helmet title={formatMessage(messages.homeTitle)} />

      <PermissionChecker permissions={['dashboard']}>
        <ErrorBoundary>
          <SummaryStatus className={styles.Section__summary} dashboard="home" />
        </ErrorBoundary>
      </PermissionChecker>

      {assays ? (
        <div className={styles.wrapper}>
          <PermissionChecker permissions={['dashboard']}>
            <LazyGraph>
              <ErrorBoundary>
                <TestsOverTimeGraph assaysFromState={assays} /> {/*  1  */}
              </ErrorBoundary>
            </LazyGraph>
          </PermissionChecker>

          {assays.some(a => tbPermissions.includes(a.externalId)) ? (
            <>
              <PermissionChecker permissions={['dashboard']}>
                <LazyGraph>
                  <ErrorBoundary>
                    <TbDetectedGraph assaysFromState={assays} resultCategoryGroupsFromState={resultCategoryGroups} />{' '}
                    {/* 2 */}
                  </ErrorBoundary>
                </LazyGraph>
              </PermissionChecker>
              <PermissionChecker permissions={['dashboard']}>
                <LazyGraph>
                  <ErrorBoundary>
                    <TbRifDetectedGraph assaysFromState={assays} resultCategoryGroupsFromState={resultCategoryGroups} />{' '}
                    {/* 3 */}
                  </ErrorBoundary>
                </LazyGraph>
              </PermissionChecker>
            </>
          ) : null}

          {assays.some(a => xdrPermissions.includes(a.externalId)) ? (
            <PermissionChecker permissions={['dashboard']}>
              <LazyGraph>
                <ErrorBoundary>
                  <XDRFLQResistanceGraph /> {/* 4 */}
                </ErrorBoundary>
              </LazyGraph>
            </PermissionChecker>
          ) : null}

          {assays.some(a => covidPermissions.includes(a.externalId)) && !isCountry('BD') ? (
            <PermissionChecker permissions={['dashboard']}>
              <LazyGraph>
                <ErrorBoundary>
                  <CovidResultGraph assaysFromState={assays} resultCategoryGroupsFromState={resultCategoryGroups} />{' '}
                  {/* 11 */}
                </ErrorBoundary>
              </LazyGraph>
            </PermissionChecker>
          ) : null}

          {assays.some(a => hivPermissions.includes(a.externalId)) ? (
            <PermissionChecker permissions={['dashboard']}>
              <LazyGraph>
                <ErrorBoundary>
                  <HivResultsGraph assaysFromState={assays} resultCategoryGroupsFromState={resultCategoryGroups} />{' '}
                  {/* 12 */}
                </ErrorBoundary>
              </LazyGraph>
            </PermissionChecker>
          ) : null}

          {!isCountry('BD') ? (
            <PermissionChecker permissions={['dashboard', 'operationalData']}>
              <LazyGraph>
                <ErrorBoundary>
                  <DeviceStatusGraph assaysFromState={assays} /> {/* 13 */}
                </ErrorBoundary>
              </LazyGraph>
            </PermissionChecker>
          ) : null}
          <PermissionChecker permissions={['dashboard', 'operationalData']}>
            <LazyGraph>
              <ErrorBoundary>
                <InventoryStatusGraph assaysFromState={assays} /> {/* 14 */}
              </ErrorBoundary>
            </LazyGraph>
          </PermissionChecker>

          {assays.some(a => hivPermissions.includes(a.externalId)) ? (
            <PermissionChecker permissions={['dashboard', '+reporter']}>
              <LazyGraph>
                <ErrorBoundary>
                  <TreatmentStatusGraph assaysFromState={assays} /> {/* 15 */}
                </ErrorBoundary>
              </LazyGraph>
            </PermissionChecker>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

export default Status
