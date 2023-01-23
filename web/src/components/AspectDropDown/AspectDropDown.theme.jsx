import variables from '../../theme/colors'

const {
  '--ming': aspectPrimary,
  '--aspect-color-chill-blue-1': aspectChillBlue1,
  '--aspect-color-chill-blue-3': aspectChillBlue3,
  '--aspect-color-white': aspectWhite,
  '--white-lilac-2': lilac2,
} = variables.customPropertiesVariables

const styleOptionBase = {
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  lineHeight: 1,
  '& svg': {
    margin: '0 5px 0',
  },
}
export const getAspectTheme = () => {
  return {
    option: (provided, state) => {
      const { isSelected, isFocused } = state
      return {
        ...provided,
        ...styleOptionBase,
        color: isSelected ? aspectWhite : aspectChillBlue1,
        backgroundColor: (isSelected && aspectChillBlue3) || (isFocused && lilac2),
      }
    },
    control: provided => ({
      ...provided,
      width: '100%',
      backgroundColor: aspectChillBlue1,
      display: 'flex',
      borderRadius: '5px',
      padding: '0 8px 0',
      margin: '0 0 0 5px',
      '& svg': {
        ...provided['& svg'],
        color: aspectWhite,
      },
    }),
    placeholder: provided => ({
      ...provided,
      color: aspectWhite,
    }),
    clearIndicator: provided => ({
      ...provided,
      ':hover': aspectWhite,
      color: aspectWhite,
    }),
    dropdownIndicator: provided => ({
      ...provided,
      ':hover': aspectWhite,
      color: aspectWhite,
      padding: '8px 0 8px 8px',
    }),
    input: provided => ({
      ...provided,
      color: aspectWhite,
    }),
    singleValue: provided => ({
      ...provided,
      color: aspectWhite,
    }),
    multiValue: provided => ({
      ...provided,
      backgroundColor: 'transparent',
      color: aspectPrimary,
    }),
    multiValueLabel: provided => ({
      ...provided,
      color: aspectWhite,
    }),
  }
}
export const getMuiTheme = () => {
  return {
    option: provided => ({
      ...provided,
      ...styleOptionBase,
    }),
    control: provided => ({
      ...provided,
      display: 'flex',
      alignItems: 'center',
      border: 0,
      height: 'auto',
      background: 'transparent',
      borderColor: 'transparent',
      boxShadow: 'none',
      '&:hover': {
        boxShadow: 'none',
      },
      width: '100%',
      '&::before': {
        left: 0,
        right: 0,
        bottom: 0,
        content: '" "',
        position: 'absolute',
        transition: 'border-bottom-color 200ms cubic-bezier(0.4, 0, 0.2, 1) 0ms',
        borderBottom: '1px solid rgba(0, 0, 0, 0.42)',
        pointerEvents: 'none',
      },
      '&::after': {
        left: 0,
        right: 0,
        bottom: 0,
        content: '""',
        position: 'absolute',
        transform: 'scaleX(0)',
        transition: 'transform 200ms cubic-bezier(0.0, 0, 0.2, 1) 0ms',
        borderBottom: '2px solid #689f38',
        pointerEvents: 'none',
      },
    }),
    menu: provided => ({
      ...provided,
      backgroundColor: aspectWhite,
      width: '100%',
    }),
    menuList: provided => ({
      ...provided,
      overflowY: 'auto',
    }),
    valueContainer: provided => ({
      ...provided,
      paddingLeft: 0,
    }),
    indicatorSeparator: provided => ({
      ...provided,
      display: 'none',
    }),
  }
}
