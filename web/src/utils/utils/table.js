export function addDepth(items) {
  const tree = { children: items }
  const stack = [[tree, 0]]
  let n
  while (stack?.length) {
    n = stack.length
    const [node, i] = stack[n - 1]
    if (i < node?.children?.length) {
      stack.push([node.children[i], 0])
      // eslint-disable-next-line no-plusplus
      stack[n - 1][1]++
    } else {
      stack.pop()
      node.depth = n
    }
  }

  return tree?.children
}
