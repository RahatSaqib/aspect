export const legend = {
  anchor: 'bottom',
  direction: 'row',
  justify: false,
  translateX: 0,
  translateY: 60,
  itemsSpacing: 0,
  itemDirection: 'left-to-right',
  itemWidth: 80,
  itemHeight: 20,
  itemOpacity: 0.75,
  symbolSize: 12,
  symbolShape: 'square',
  symbolBorderColor: 'rgba(0, 0, 0, .5)',
  effects: [
    {
      on: 'hover',
      style: {
        itemBackground: 'rgba(0, 0, 0, .03)',
        itemOpacity: 1,
      },
    },
  ],
}

export const margin = { top: 7, right: 30, bottom: 70, left: 50 }
