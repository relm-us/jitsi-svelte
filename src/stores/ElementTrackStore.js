import { writable, derived, get } from 'svelte/store'

function createElementAndTrackStore() {
  let attachedTrack

  const elementStore = writable(null)
  const trackStore = writable(null)

  const detach = () => {
    const element = get(elementStore)
    if (attachedTrack) {
      attachedTrack.detach(element)
      attachedTrack = null
    }
  }

  const attach = () => {
    const track = get(trackStore)
    const element = get(elementStore)
    if (track && track !== attachedTrack) {
      detach()
      attachedTrack = track
      track.attach(element)
    }
  }

  const store = derived([elementStore, trackStore], ([$element, $track]) => {
    return { element: $element, track: $track }
  })

  store.subscribe(($props) => {
    if ($props.element && $props.track) {
      attach()
    }
  })

  return {
    subscribe: store.subscribe,

    attach,

    detach,

    setElement: (element) => {
      elementStore.set(element)
    },

    setTrack: (track) => {
      if (track !== get(trackStore)) {
        trackStore.set(track)
      }
    },
  }
}

export { createElementAndTrackStore }
