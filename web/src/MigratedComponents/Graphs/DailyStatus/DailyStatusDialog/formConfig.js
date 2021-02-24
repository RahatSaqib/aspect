export default {
  title: '',
  icon: 'document',
  actions: {
    default: 'save',
  },
  sections: [
    {
      id: 0,
      hideHeader: true,
      rows: [
        {
          id: 0,
          items: [
            {
              id: 'startedOn',
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
            },
            {
              id: 'endedOn',
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
            },
          ],
        },
        {
          id: 1,
          items: [
            {
              id: 'reason',
              controlType: {
                component: 'select',
              },
              label: 'Reason',
            },
          ],
        },
        {
          id: 2,
          items: [
            {
              id: 'note',
              controlType: {
                component: 'textArea',
                rowsMax: 4,
              },
              label: 'Note',
            },
          ],
        },
      ],
    },
  ],
}
