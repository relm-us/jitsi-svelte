/**
 * Restrict valid function names to 'addEventListener' and 'removeEventListener'
 *
 * @param {string} direction - 'add' | 'remove'
 */
function eventListenerDirection(direction) {
  switch (direction) {
    case 'add':
      return 'addEventListener'
    case 'remove':
      return 'removeEventListener'
    default:
      throw new Error(
        `eventListener direction must be 'add' or 'remove', but was '${direction}'`
      )
  }
}

function trackDirection(direction) {
  switch (direction) {
    case 'add':
      return 'addTrack'
    case 'remove':
      return 'removeTrack'
    default:
      throw new Error(
        `addRemoveTrack direction must be 'add' or 'remove', but was '${direction}'`
      )
  }
}

/**
 * Add or remove a batch of JitsiMeetJS events on a given listening object
 *
 * @param {string} direction - 'add' | 'remove' event listeners
 * @param {any} listening - object that can listen for events, i.e. must have 'addEventListener', 'removeEventListener'
 * @param {object} events - an object containing event types as keys and values as object containing event names as keys and event functions as values
 */
function wireEventListeners(direction, listening, events) {
  let fnName = eventListenerDirection(direction)

  for (const eventType of Object.keys(events)) {
    for (const [eventName, callback] of Object.entries(events[eventType])) {
      listening[fnName](JitsiMeetJS.events[eventType][eventName], callback)
    }
  }
}

export { eventListenerDirection, trackDirection, wireEventListeners }
