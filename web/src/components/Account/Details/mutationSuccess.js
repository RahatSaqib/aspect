function mutationSuccess(queryData, response, navigate, type, outcome) {
  const ok = outcome
  const updatedLogin = response.canLogIn && queryData?.data?.canLogIn !== response.canLogIn
  switch (true) {
    case type === 'add' && ok:
      navigate(`/browse/person/${response?.id}`)
      break

    case type === 'update' && updatedLogin && ok:
      navigate(`/browse/person/${response?.id}/system-access-control`)
      window.location.reload()
      break

    case type === 'update' && !updatedLogin && ok:
      navigate('/browse/person?filters=contactStatus%3D0')
      break

    case type === 'self' && ok:
      navigate('/dashboard')
      window.location.reload()
      break

    default:
      throw new Error(`Could not complete the operation. Type: ${type} | Status: ${ok ? 'true' : 'false'}`)
  }
}

export default mutationSuccess
