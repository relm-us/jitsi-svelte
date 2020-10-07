function hasAncestor(element, ancestor) {
  if (element === null) {
    return false
  } else if (element === ancestor) {
    return true
  } else {
    return hasAncestor(element.parentNode, ancestor)
  }
}

export default hasAncestor
