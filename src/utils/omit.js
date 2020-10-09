function omit(obj, remove) {
  var result = {}
  if (typeof remove === 'string') {
    remove = [].slice.call(arguments, 1)
  }
  for (var prop in obj) {
    if (!obj.hasOwnProperty || obj.hasOwnProperty(prop)) {
      if (remove.indexOf(prop) === -1) {
        result[prop] = obj[prop]
      }
    }
  }
  return result
}

export default omit
