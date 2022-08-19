module.exports = function (request, response) {
  console.log('\x1b[1;36m', '🚀 ➜ file: getLevelByUserSelectList.js ➜ line 2 ➜ request', request)
  const { auth } = request
  // const levels = filterByJobFunction(request.auth)
  const levels = [
    { name: 'Country', id: 'country' },
    { name: 'State', id: 'state' },
    { name: 'LGA', id: 'lga' },
    { name: 'Site', id: 'site' },
  ]

  return levels
}

function filterByJobFunction(auth) {
  console.log('\x1b[1;36m', '🚀 ➜ file: getLevelByUserSelectList.js ➜ line 12 ➜ auth', auth)

  return auth
}
