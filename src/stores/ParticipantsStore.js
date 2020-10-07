import omit from 'just-omit'
import { derived, writable, get } from 'svelte/store'

function createSingleParticipantStore(isLocal = false) {
  const fieldsStore = writable({
    jid: null,
    role: null,

    audioLevel: 0.0,
    audioEnabled: false,
    videoEnabled: false,
    screenEnabled: false,

    // {x: float, y: float} | null
    position: null,
    // float | null
    size: null,
    // boolean
    visible: false,
    // boolean
    isLocal,
  })

  // Stores JitsiTrack by track type ('audio' | 'video' | 'desktop')
  const tracksStore = writable({})

  const store = derived(
    [fieldsStore, tracksStore],
    ([$fields, $tracks], set) => {
      set({ ...$fields, ...$tracks })
    },
    {}
  )

  return {
    subscribe: store.subscribe,

    setJid: (jid) => {
      fieldsStore.update(($fields) => ({ ...$fields, jid }))
    },

    setRole: (role) => {
      fieldsStore.update(($fields) => ({ ...$fields, role }))
    },

    setAudioLevel: (audioLevel) => {
      fieldsStore.update(($fields) => ({ ...$fields, audioLevel }))
    },

    updateFieldsFromJitsiParticipant: (participant) => {
      fieldsStore.update(($fields) => {
        return {
          ...$fields,
          jid: participant.getId(),
          role: participant.getRole(),
        }
      })
    },

    addTrack: (track) => {
      const trackType = track.getType()
      tracksStore.update(($tracks) => ({
        ...$tracks,
        [trackType]: track,
      }))
    },

    removeTrack: (track) => {
      const trackType = track.getType()
      tracksStore.update(($tracks) => omit($tracks, [trackType]))
    },

    // Expose read-only versions of fields & tracks stores so
    // they can be subscribed to individually
    fieldsStore: { subscribe: fieldsStore.subscribe },
    tracksStore: { subscribe: tracksStore.subscribe },
  }
}

function createParticipantsStore() {
  const store = writable({})

  const { subscribe, update, set } = store

  const updateParticipant = (participantId, action) => {
    let participant = get(store)[participantId]
    if (participant) {
      action(participant, false)
    } else {
      store.update(($participants) => {
        if ($participants[participantId]) {
          console.warn(`participant '${participantId}' should not exist`)
        }
        participant = createSingleParticipantStore()
        action(participant, true)
        return {
          ...$participants,
          [participantId]: participant,
        }
      })
    }
  }

  return {
    subscribe,
    update,
    updateParticipant,
    set,
  }
}

export { createParticipantsStore, createSingleParticipantStore }
