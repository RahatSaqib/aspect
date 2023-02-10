const getPickersLocalization = pickersTranslations => {
  return {
    components: {
      MuiLocalizationProvider: {
        defaultProps: {
          localeText: { ...pickersTranslations },
        },
      },
    },
  }
}

export default getPickersLocalization
