import { useContext } from 'react'
import { I18nContext } from '../../providers/I18nProvider'

const useI18n = () => {
  const context = useContext(I18nContext)
  if (context === undefined) {
    throw new Error('useI18n must be used within a I18nProvider')
  }
  return context
}

export default useI18n
