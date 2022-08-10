const links = ['/browse/site', '/browse/site/209', '/browse/person', '/browse/person/9', 'https://google.com']

const permissions = ['browse, device', 'browse, site', 'browse, site:edit', 'browse, person', 'browse, person:edit']

const expected = [
  {
    link: links[0],
    permissions: permissions[0],
    expected: false,
  },
  {
    link: links[0],
    permissions: permissions[1],
    expected: true,
  },
  {
    link: links[0],
    permissions: permissions[2],
    expected: true,
  },
  {
    link: links[0],
    permissions: permissions[3],
    expected: false,
  },
  {
    link: links[0],
    permissions: permissions[4],
    expected: false,
  },
  // next link
  {
    link: links[1],
    permissions: permissions[0],
    expected: false,
  },
  {
    link: links[1],
    permissions: permissions[1],
    expected: false,
  },
  {
    link: links[1],
    permissions: permissions[2],
    expected: true,
  },
  {
    link: links[1],
    permissions: permissions[3],
    expected: false,
  },
  {
    link: links[1],
    permissions: permissions[4],
    expected: false,
  },
  // next link
  {
    link: links[2],
    permissions: permissions[0],
    expected: false,
  },
  {
    link: links[2],
    permissions: permissions[1],
    expected: false,
  },
  {
    link: links[2],
    permissions: permissions[2],
    expected: false,
  },
  {
    link: links[2],
    permissions: permissions[3],
    expected: true,
  },
  {
    link: links[2],
    permissions: permissions[4],
    expected: true,
  },
  // next link
  {
    link: links[4],
    permissions: permissions[0],
    expected: true,
  },
  {
    link: links[3],
    permissions: permissions[1],
    expected: false,
  },
  {
    link: links[3],
    permissions: permissions[2],
    expected: false,
  },
  {
    link: links[3],
    permissions: permissions[3],
    expected: false,
  },
  {
    link: links[3],
    permissions: permissions[4],
    expected: true,
  },
  // next link
  {
    link: links[4],
    permissions: permissions[0],
    expected: true,
  },
  {
    link: links[4],
    permissions: permissions[1],
    expected: true,
  },
  {
    link: links[4],
    permissions: permissions[2],
    expected: true,
  },
  {
    link: links[4],
    permissions: permissions[3],
    expected: true,
  },
  {
    link: links[4],
    permissions: permissions[4],
    expected: true,
  },
]

export { expected, links, permissions }
