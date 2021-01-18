import { permissions, links } from '../stories/AspectLink.stories'

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

export default expected
