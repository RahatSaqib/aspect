export function isEditable(user/* TODO: add me back, site */) {
  const editable = user.name === 'admin'
  // TODO: is user has write access to the object?

  return editable
}

export function latLng(site) {
  return {
    lat: site.get('latitude'),
    lng: site.get('longitude')
  }
}

export function address(site) {
  return {
    country: site.get('country'),
    state: site.get('state'),
    lga: site.get('lga'),
    city: site.get('city'),
    address: site.get('street1'),
    address2: site.get('street2')
  }
}
