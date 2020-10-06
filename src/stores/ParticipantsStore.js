import omit from 'just-omit'
import { derived, writable, get } from 'svelte/store'

function createSingleParticipantStore() {
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
    // update: fieldsStore.update,
    fields: fieldsStore,
    tracks: tracksStore,

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
      tracksStore.update(($tracks) => ({
        ...$tracks,
        [track.getType()]: track,
      }))
    },
    removeTrack: (trackType) => {
      tracksStore.update(($tracks) => omit($tracks, [trackType]))
    },
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

// A store Participant data for the local participant
const localParticipant = createSingleParticipantStore()

export {
  localParticipant,
  createParticipantsStore,
  createSingleParticipantStore,
}
