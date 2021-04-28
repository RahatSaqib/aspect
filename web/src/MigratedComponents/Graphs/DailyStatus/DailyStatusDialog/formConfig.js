export default {
  icon: 'document',
  actions: {
    default: 'save',
  },
  classNames: {
    container: 'form-container',
  },
  sections: [
    {
      id: 0,
      hideHeader: true,
      classNames: {
        container: 'section-items-container',
      },
      rows: [
        {
          id: 0,
          items: [
            {
              id: 'startedOn',
              labelI18nKey: 'startDate',
              controlType: {
                component: 'datePicker',
                format: 'dd MMM yyyy',
                // flags for setting picker in date range
                selectsStart: true,
                // field id's for corresponding props in date range
                startDateId: 'startedOn', // for startDate
                endDateId: 'endedOn', // for endDate
                maxDateId: 'endedOn', // for maxDate
              },
              type: 'string',
              label: 'Start Date',
              initialValue: new Date().toDateString(),
              classNames: {
                itemContainer: 'date-range-item-container',
              },
            },
            {
              id: 'endedOn',
              labelI18nKey: 'endDate',
              controlType: {
                component: 'datePicker',
                format: 'dd MMM yyyy',
                // flags for setting picker in date range
                selectsEnd: true,
                // field id's for corresponding props in date range
                startDateId: 'startedOn', // for startDate
                endDateId: 'endedOn', // for endDate
                minDateId: 'startedOn', // for minDate
              },
              type: 'string',
              label: 'End Date',
              initialValue: new Date().toDateString(),
              classNames: {
                itemContainer: 'date-range-item-container',
              },
            },
          ],
        },
        {
          id: 1,
          items: [
            {
              id: 'reason',
              labelI18nKey: 'reason',
              controlType: {
                component: 'select',
              },
              label: 'Reason',
              classNames: {
                itemContainer: 'section-item-container',
                item: 'section-item',
                controlContainer: 'control-container',
                controlLabel: 'control-label',
              },
            },
          ],
        },
        {
          id: 2,
          items: [
            {
              id: 'note',
              labelI18nKey: 'notes',
              controlType: {
                component: 'textArea',
                rowsMax: 4,
              },
              label: 'Note',
              classNames: {
                itemContainer: 'section-item-container',
                item: 'section-item',
              },
            },
          ],
        },
      ],
    },
  ],
}
