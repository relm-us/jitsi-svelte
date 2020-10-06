import { writable, derived, get } from 'svelte/store'
import omit from 'just-omit'

import {
  localParticipant as localParticipantStore,
  createParticipantsStore,
} from './ParticipantsStore.js'
import { trackDirection, wireEventListeners } from '/utils/events.js'

const CLEANUP_EVENT_LISTENERS_MAX_TIMEOUT = 4000

const ConferenceState = {
  INITIAL: 'initial',
  JOINING: 'joining',
  JOINED: 'joined',
  LEAVING: 'leaving',
  LEFT: 'left',
  FAILED: 'failed',
  ERROR: 'error',
  KICKED: 'kicked',
}

function createSingleConferenceStore(conferenceId, connectionStore) {
  const stateStore = writable(ConferenceState.INITIAL)

  const localJidStore = writable(null)

  // A store of objects, keys are participantIds and values are stores
  const remoteParticipantsStore = createParticipantsStore()

  const store = derived(
    connectionStore,
    ($connection, set) => {
      if ($connection) {
        const conference = $connection.initJitsiConference(conferenceId, {
          openBridgeChannel: 'websocket',
        })
        if (!conference) {
          console.error('conference is null')
        }

        const setStatus = (state) => {
          switch (state) {
            case ConferenceState.JOINING:
              // Record the ID we're given to identify "self"
              localJidStore.set(conference.myUserId())
              break
            case ConferenceState.JOINED:
              set(conference)
              break
            default:
              set(null)
              localJidStore.set(null)
          }
          stateStore.set(state)
        }

        const addRemoveTrack = (track, direction) => {
          let fnName = trackDirection(direction)

          if (track.isLocal()) {
            localParticipantStore[fnName](track)
          } else {
            const participantId = track.getParticipantId()
            if (participantId) {
              remoteParticipantsStore.updateParticipant(
                participantId,
                (remoteParticipant, _didAddParticipant) => {
                  remoteParticipant[fnName](track)
                }
              )
            } else {
              console.warn(`Track does not have participantId`, track)
            }
          }
        }

        const events = {
          conference: {
            CONFERENCE_JOINED: () => setStatus(ConferenceState.JOINED),
            CONFERENCE_LEFT: () => {
              wireEventListeners('remove', conference, events)
              setStatus(ConferenceState.LEFT)
            },
            CONFERENCE_FAILED: () => setStatus(ConferenceState.FAILED),
            CONFERENCE_ERROR: (errorCode) => {
              console.error('Jitsi conference error', errorCode)
              setStatus(ConferenceState.ERROR)
            },
            KICKED: () => setStatus(ConferenceState.KICKED),

            USER_JOINED: (participantId, participant) => {
              remoteParticipantsStore.updateParticipant(
                participantId,
                (remoteParticipant, _didAddParticipant) => {
                  remoteParticipant.updateFieldsFromJitsiParticipant(
                    participant
                  )
                }
              )
            },
            USER_LEFT: (participantId) => {
              remoteParticipantsStore.update(($participants) => {
                return omit($participants, [participantId])
              })
            },
            USER_ROLE_CHANGED: (participantId, role) => {
              remoteParticipantsStore.updateParticipant(
                participantId,
                (remoteParticipant, _didAddParticipant) => {
                  remoteParticipant.fields.update(($fields) => {
                    return { ...$fields, role }
                  })
                }
              )
            },

            TRACK_ADDED: (track) => {
              addRemoveTrack(track, 'add')
              // track.addEventListener(JitsiMeetJS.events.track.TRACK_AUDIO_LEVEL_CHANGED)
            },
            TRACK_REMOVED: (track) => {
              addRemoveTrack(track, 'remove')
            },
            TRACK_AUDIO_LEVEL_CHANGED: (participantId, audioLevel) => {
              remoteParticipantsStore.updateParticipant(
                participantId,
                (remoteParticipant, _didAddParticipant) => {
                  remoteParticipant.fields.update(($fields) => {
                    return { ...$fields, audioLevel }
                  })
                }
              )
            },
          },
        }

        // Add all `events` functions as eventListeners on the JitsiConference object
        wireEventListeners('add', conference, events)

        setStatus(ConferenceState.JOINING)
        conference.join()

        // When connection status changes, clean up before re-creating a new JitsiConference
        return () => {
          const $state = get(stateStore)
          if (
            $state === ConferenceState.JOINING ||
            $state === ConferenceState.JOINED
          ) {
            const $connection = get(connectionStore)

            // Can't leave if the connection is null
            if ($connection) {
              // Leave the conference
              setStatus(ConferenceState.LEAVING)
              conference
                .leave()
                .then(() => {
                  console.log('Left conference', conferenceId)
                  // status will be set by CONFERENCE_LEFT callback
                })
                .catch((err) => {
                  setStatus(ConferenceState.LEFT)
                  console.warn('Error when leaving conference', err)
                })

              /**
               * Make sure we clean up event listeners.
               *
               * NOTE: Hopefully this will have been taken care of by
               *       the CONFERENCE_LEFT event, but if not this will
               *       be our fallback, e.g. in the case of
               *       CONFERENCE_FAILED or other states.
               */
              setTimeout(
                () => wireEventListeners('remove', conference, events),
                CLEANUP_EVENT_LISTENERS_MAX_TIMEOUT
              )
            } else {
              setStatus(ConferenceState.LEFT)
              wireEventListeners('remove', conference, events)
            }
          } else {
            // Whether or not we're joined, we must still clean up event listeners
            setStatus(ConferenceState.LEFT)
            wireEventListeners('remove', conference, events)
          }
        }
      }
    },

    // Initial derived store value
    null
  )

  /**
   * A store containing all participant stores, both local and remote.
   *
   * This derives from `store` because we need to guarantee that there is
   * at least one subscriber to `store`, so that the conference is joined.
   */
  const allParticipantsStore = derived(
    [localParticipantStore, remoteParticipantsStore, store],
    ([$localParticipant, $remoteParticipants, $store], set) => {
      if ($store) {
        const allParticipants = {}

        for (let [participantId, remoteParticipantStore] of Object.entries(
          $remoteParticipants
        )) {
          if (get(remoteParticipantStore).jid) {
            allParticipants[participantId] = remoteParticipantStore
          }
        }

        // Add local participant, if present
        if ($localParticipant && $localParticipant.jid) {
          allParticipants[$localParticipant.jid] = $localParticipantStore
        }

        set(allParticipants)
      } else {
        set({})
      }
    },
    {}
  )

  return {
    subscribe: store.subscribe,
    state: stateStore,
    localJid: localJidStore,
    participants: allParticipantsStore,
  }
}

function createConferencesStore(connectionStore) {
  const store = writable({})

  const { subscribe, update, set } = store

  const join = (conferenceId) => {
    update(($store) => {
      return {
        ...$store,
        [conferenceId]: createSingleConferenceStore(
          conferenceId,
          connectionStore
        ),
      }
    })
  }

  const leave = (conferenceId) => {
    update(($store) => {
      const conferenceStore = $store[conferenceId]
      if (conferenceStore) {
        // TODO: deinit
      }
      return omit($store, [conferenceId])
    })
  }

  return { subscribe, join, leave }
}

export { createConferencesStore, ConferenceState }
