import React from 'react'
import PermIdentity from '@mui/icons-material/PermIdentity'
import differenceInCalendarDays from 'date-fns/differenceInCalendarDays'
import { format as date } from 'date-fns/format'
import parseISO from 'date-fns/parseISO'
import { defineMessages } from 'react-intl'
import { compose, pure, withHandlers, withState } from 'recompose'
import { Accordion, AccordionHeader, AccordionDetail } from '../../components/shared/accordion'
import AspectButton from '../../components/shared/AspectButton'
import CheckboxField from '../../components/shared/CheckboxField'
import requirePermission from '../../components/shared/requirePermissions'
import ResultTreatmentNoteModal from './ResultTreatmentNoteModal'

const messages = defineMessages({
  linkedToTreatment: {
    id: 'pages.resultTreatmentPanel.linkedToTreatment',
    defaultMessage: 'Linked to treatment',
  },
  confirm: {
    id: 'pages.resultTreatmentPanel.confirm',
    defaultMessage: 'Confirm',
  },
  notPossible: {
    id: 'pages.resultTreatmentPanel.notPossible',
    defaultMessage: 'Not possible',
  },
  notYetConfirmedOnTreatment: {
    id: 'pages.resultTreatmentPanel.notYetConfirmedOnTreatment',
    defaultMessage: 'Not yet confirmed on treatment',
  },
  days: {
    id: 'pages.resultTreatmentPanel.days',
    defaultMessage: 'days',
  },
  addNote: {
    id: 'pages.resultTreatmentPanel.addNote',
    defaultMessage: 'Add Note',
  },
  note: {
    id: 'pages.resultTreatmentPanel.note',
    defaultMessage: 'NOTE:',
  },
})

const enhance = compose(
  pure,
  withState('isShown', 'setIsShown', false),
  withState('isActive', 'setIsActive', false),
  withState('note', 'setNote', ''),
  requirePermission({
    permissions: ['treatmentStatus:view'],
  }),
  withHandlers({
    onToggleShown:
      ({ setIsShown }) =>
      () =>
        setIsShown(isShown => !isShown),
    onNoteChange:
      ({ setIsActive, setNote }) =>
      event => {
        const note = event.target.value.trim()
        const checkNote = note !== ''
        setNote(() => note)
        return setIsActive(() => checkNote)
      },
    onNoteSubmit:
      ({ addResultNote, setIsShown, resultId, note }) =>
      () => {
        addResultNote(resultId, {
          note,
          resultNoteType: 'ResultFollowUp',
        })
        return setIsShown(isShown => !isShown)
      },
  })
)
const ResultTreatmentPanel = ({ styles, data, intl: { formatMessage }, ...restProps }) => {
  const treatmentCheckBoxList = [
    {
      id: 'OnTreatment',
      label: formatMessage(messages.confirm),
    },
    {
      id: 'NotPossible',
      label: formatMessage(messages.notPossible),
    },
    {
      id: 'AwaitingTreatment',
      label: formatMessage(messages.notYetConfirmedOnTreatment),
    },
  ]

  const resultNotes = data.get('resultNotes').toJS()

  return (
    <div>
      <Accordion expanded className={styles.TreatmentNoteAccordionContainer}>
        <AccordionHeader
          label={
            <div className={styles.Treatment}>
              {data.get('treatmentStatusInfo') && (
                <PermIdentity className={styles[`${data.get('treatmentStatusInfo')}`]} />
              )}

              <div className={styles.TreatmentInfo}>
                {!data.get('resultTreatmentStatus') && <h4>{formatMessage(messages.notYetConfirmedOnTreatment)}</h4>}
                {treatmentCheckBoxList.map(
                  treatmentStatus =>
                    treatmentStatus.id === data.get('resultTreatmentStatus') && (
                      <h4>
                        {treatmentStatus.label}
                        {treatmentStatus.id !== 'AwaitingTreatment' && (
                          <span>- {date(parseISO(data.get('resultTreatmentStatusCreatedOn')), 'dd/MM/yyyy')}</span>
                        )}
                      </h4>
                    )
                )}
                {data.get('endedOn') && (
                  <h3>
                    {differenceInCalendarDays(new Date(), parseISO(data.get('endedOn')))}
                    &nbsp;{formatMessage(messages.days)}
                  </h3>
                )}
              </div>
            </div>
          }
        >
          <div className={styles.TreatmentLinkLayout}>
            <div>
              <p className={styles.TreatmentCheckBoxLabel}>{formatMessage(messages.linkedToTreatment)}</p>
              <div className={styles.TreatmentCheckBox}>
                {treatmentCheckBoxList.map(
                  treatmentCheckbox =>
                    treatmentCheckbox.id !== 'AwaitingTreatment' && (
                      <CheckboxField
                        onChange={restProps.onTreatmentChange}
                        id={treatmentCheckbox.id}
                        disabled={!restProps.userPermission.includes('treatmentStatus:edit')}
                        checked={treatmentCheckbox.id === data.get('resultTreatmentStatus')}
                        label={treatmentCheckbox.label}
                        className={styles.TreatmentCheckBox}
                      />
                    )
                )}
              </div>
            </div>
            <AspectButton className={styles.LinkButton} onClick={restProps.onToggleShown}>
              {formatMessage(messages.addNote)}
            </AspectButton>
          </div>
        </AccordionHeader>
        {resultNotes.length > 0 && (
          <AccordionDetail>
            <div className={styles.TreatmentNoteContainer}>
              <div className={styles.TreatmentNoteHeader}>
                <p>{formatMessage(messages.note)}</p>
              </div>
              {resultNotes.map(resultNote => (
                <div className={styles.TreatmentNoteComment}>
                  <div className={styles.TreatmentNoteBody}>{resultNote.text}</div>
                  <div className={styles.TreatmentNoteFooter}>
                    <span>Note added by: </span>
                    <span> {`${resultNote.createdBy} - ${date(parseISO(resultNote.createdOn), 'dd/MM/yyyy')}`} </span>
                  </div>
                </div>
              ))}
            </div>
          </AccordionDetail>
        )}
      </Accordion>
      <ResultTreatmentNoteModal data={data} restProps={restProps} />
    </div>
  )
}

export default enhance(ResultTreatmentPanel)
