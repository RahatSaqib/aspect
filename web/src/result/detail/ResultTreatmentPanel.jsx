import React from 'react'
import PermIdentity from '@material-ui/icons/PermIdentity'
import { format as date, differenceInCalendarDays, parseISO } from 'date-fns'
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
    onNoteChange: ({ setIsActive, setNote }) => event => {
      const note = event.target.value.trim()
      const checkNote = event.target.value.trim() !== ''
      setNote(() => note)
      return setIsActive(() => checkNote)
    },
    onNoteSubmit: ({
      logTreatmentStatus,
      setIsShown,
      resultId,
      note,
    }) => () => {
      logTreatmentStatus(resultId, {
        data: note,
        resultNoteType: 'ResultFollowUp',
      })
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

  const resultNotes = data.get('resultTreatmentData').toJS()

  return (
    <div>
      <ExpansionPanel
        expanded
        className={styles.TreatmentNoteExpansionPanelContainer}
      >
        <ExpansionPanelHeader
          label={
            <div className={styles.Treatment}>
              {data.get('treatmentStatusInfo') && (
                <PermIdentity
                  className={styles[`${data.get('treatmentStatusInfo')}`]}
                />
              )}

              <div className={styles.TreatmentInfo}>
                {!data.get('resultTreatmentStatus') && (
                  <h4>Not yet confirmed on treatment</h4>
                )}
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
                              parseISO(
                                data.get('resultTreatmentStatusCreatedOn')
                              ),
                              'dd/MM/yyyy'
                            )}
                          </span>
                        )}
                      </h4>
                    )
                )}
                <h3>
                  {differenceInCalendarDays(
                    new Date(),
                    parseISO(data.get('endedOn'))
                  )}
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
        {resultNotes.length > 0 && (
          <ExpansionPanelDetail className={styles.TreatmentNoteContainer}>
            <div className={styles.TreatmentNoteHeader}>
              <p>NOTE:</p>
            </div>
            {resultNotes.map(resultNote => (
              <div className={styles.TreatmentNoteComment}>
                <div className={styles.TreatmentNoteBody}>
                  {resultNote.text}
                </div>
                <div className={styles.TreatmentNoteFooter}>
                  <span>Note added by: </span>
                  <span>
                    {' '}
                    {`${resultNote.createdBy} - ${date(
                      parseISO(resultNote.createdOn),
                      'dd/MM/yyyy'
                    )}`}{' '}
                  </span>
                </div>
              </div>
            ))}
          </ExpansionPanelDetail>
        )}
      </ExpansionPanel>
      <ResultTreatmentNoteModal data={data} restProps={restProps} />
    </div>
  )
}

export default enhance(ResultTreatmentPanel)
