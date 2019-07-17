import React from 'react'
import PermIdentity from '@material-ui/icons/PermIdentity'
import { format as date, differenceInCalendarDays } from 'date-fns'
import { compose, pure, withHandlers, withState } from 'recompose'
import requirePermission from '../../components/shared/requirePermissions'

import {
  ExpansionPanel,
  ExpansionPanelHeader,
  ExpansionPanelDetail,
} from '../../components/shared/expansionPanel'
import CheckboxField from '../../components/shared/CheckboxField'
import AspectButton from '../../components/shared/AspectButton'
import ResultTreatmentNoteModal from './ResultTreatmentNoteModal'

const enhance = compose(
  pure,
  withState('isShown', 'setIsShown', false),
  withState('isActive', 'setIsActive', false),
  withState('note', 'setNote', ''),
  requirePermission({
    permissions: [
      'treatmentStatus:admin',
      'treatmentStatus:view',
      'treatmentStatus:edit',
    ],
  }),
  withHandlers({
    onToggleShown: ({ setIsShown }) => () => setIsShown(isShown => !isShown),
    onNoteChange: ({ setIsActive, setNote, data }) => event => {
      const note = event.target.value.trim()
      const checkNote =
        (data.get('resultTreatmentData') || '') !== event.target.value.trim()
      setNote(() => note)
      return setIsActive(() => checkNote)
    },
    onNoteSubmit: ({
      logTreatmentStatus,
      setIsShown,
      resultId,
      note,
    }) => () => {
      logTreatmentStatus(resultId, { data: note })
      return setIsShown(isShown => !isShown)
    },
  })
)
const ResultTreatmentPanel = ({ styles, data, ...restProps }) => {
  const treatmentCheckBoxList = [
    {
      id: 'OnTreatment',
      label: 'Confirmed',
    },
    {
      id: 'NotPossible',
      label: 'Not possible',
    },
    {
      id: 'AwaitingTreatment',
      label: 'Not yet confirmed on treatment',
    },
  ]

  return (
    <div>
      <ExpansionPanel className={styles.TreatmentNoteExpansionPanelContainer}>
        <ExpansionPanelHeader
          label={
            <div className={styles.Treatment}>
              <PermIdentity
                className={styles[`${data.get('treatmentStatusInfo')}`]}
              />

              <div className={styles.TreatmentInfo}>
                {treatmentCheckBoxList.map(
                  treatmentStatus =>
                    treatmentStatus.id ===
                      data.get('resultTreatmentStatus') && (
                      <h4>
                        {treatmentStatus.label}
                        {treatmentStatus.id !== 'AwaitingTreatment' && (
                          <span>
                            -{' '}
                            {date(
                              data.get('resultTreatmentStatusCreatedOn'),
                              'dd/MM/yyyy'
                            )}
                          </span>
                        )}
                      </h4>
                    )
                )}
                <h3>
                  {differenceInCalendarDays(new Date(), data.get('endedOn'))}{' '}
                  days
                </h3>
              </div>
            </div>
          }
        >
          <div className={styles.TreatmentLinkLayout}>
            <div className={styles.TreatmentTitle}>
              <p>Link to Treatment</p>
            </div>
            <div className={styles.TreatmentCheckBox}>
              {treatmentCheckBoxList.map(
                treatmentCheckbox =>
                  treatmentCheckbox.id !== 'AwaitingTreatment' && (
                    <CheckboxField
                      onChange={restProps.onTreatmentChange}
                      id={treatmentCheckbox.id}
                      disabled={
                        !restProps.userPermission.includes(
                          'treatmentStatus:admin'
                        ) &&
                        !restProps.userPermission.includes(
                          'treatmentStatus:edit'
                        )
                      }
                      checked={
                        treatmentCheckbox.id ===
                        data.get('resultTreatmentStatus')
                      }
                      label={treatmentCheckbox.label}
                    />
                  )
              )}
              <AspectButton onClick={restProps.onToggleShown}>
                Add Note
              </AspectButton>
            </div>
          </div>
        </ExpansionPanelHeader>
        {data.get('resultTreatmentData') && (
          <ExpansionPanelDetail className={styles.TreatmentNoteContainer}>
            <div className={styles.TreatmentNoteHeader}>
              <p>NOTE:</p>
            </div>
            <div className={styles.TreatmentNoteBody}>
              {data.get('resultTreatmentData')}
            </div>
            <div className={styles.TreatmentNoteFooter}>
              <p>Note added by:</p>
              <p>{`${data.get('resultTreatmentStatusCreatedBy')} - ${date(
                data.get('resultTreatmentStatusChangedOn'),
                'dd/MM/yyyy'
              )}`}</p>
            </div>
          </ExpansionPanelDetail>
        )}
      </ExpansionPanel>
      <ResultTreatmentNoteModal data={data} restProps={restProps} />
    </div>
  )
}

export default enhance(ResultTreatmentPanel)
