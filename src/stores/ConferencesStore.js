import { writable, derived, get } from 'svelte/store'
import omit from '../utils/omit.js'

import {
  createParticipantsStore,
  createSingleParticipantStore,
} from './ParticipantsStore.js'
import { localTracksStore } from './LocalTracksStore.js'

import { addLocalTracksToConference } from '../jitsi/tracks.js'
import { trackDirection, wireEventListeners } from '../utils/events.js'

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

  // Boolean flag that signals the user has given permission to enter the conference
  const permitEntryStore = writable(false)

  // Each conference gets a "localParticipantStore" which is what represents
  // the user & the user's local tracks in this particular conference (player
  // can potentially be connected to multiple rooms at once).
  const localParticipantStore = createSingleParticipantStore(true)

  // A store of objects, keys are participantIds and values are stores
  const remoteParticipantsStore = createParticipantsStore()

  let localParticipantId
  localParticipantStore.subscribe(
    ($localParticipant) => (localParticipantId = $localParticipant.jid)
  )

  const store = derived(
    connectionStore,
    ($connection, set) => {
      if ($connection) {
        const conference = $connection.initJitsiConference(conferenceId, {
          // per latest recommendation:
          // https://community.jitsi.org/t/sctp-channels-deprecation-use-websockets/79408/8
          openBridgeChannel: 'websocket',
        })

        const setStatus = (state) => {
          switch (state) {
            case ConferenceState.JOINING:
              // Record the ID we're given to identify "self"
              localParticipantStore.setJid(conference.myUserId())
              break
            case ConferenceState.JOINED:
              set(conference)
              break
            default:
              set(null)
          }
          stateStore.set(state)
        }

        const addRemoveTrack = (track, direction) => {
          let fnName = trackDirection(direction)

          const pId = track.getParticipantId()
          if (pId) {
            remoteParticipantsStore.updateParticipant(pId, (pStore) => {
              pStore[fnName](track)
            })
          } else {
            console.warn(`Track does not have participantId`, track)
          }
        }

        const events = {
          conference: {
            /**
             * Events that affect the participant's status in the conference
             */

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

            /**
             * Events that can be used to update participant's metadata
             */

            USER_JOINED: (pId, participant) => {
              remoteParticipantsStore.updateParticipant(pId, (pStore) => {
                pStore.updateFieldsFromJitsiParticipant(participant)
              })
            },
            USER_LEFT: (pId) => {
              remoteParticipantsStore.update(($participants) => {
                return omit($participants, [pId])
              })
            },
            USER_ROLE_CHANGED: (pId, role) => {
              if (pId === localParticipantId) {
                localParticipantStore.setRole(role)
              } else {
                remoteParticipantsStore.updateParticipant(pId, (pStore) => {
                  pStore.setRole(role)
                })
              }
            },

            /**
             * "Track" events: we get notified whenever a remote participant adds an
             * audio or video track to the conference, and we can then attach it to
             * the local representation of the corresponding participant.
             */

            TRACK_ADDED: (track) => {
              addRemoveTrack(track, 'add')
            },
            TRACK_REMOVED: (track) => {
              addRemoveTrack(track, 'remove')
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

  // Whenever the conference OR the localTrackStore changes, we want to re-add
  // local tracks to the conference.
  derived(
    [store, localTracksStore, permitEntryStore],
    ([$store, $localTracks, $permitEntry]) => {
      const conference = $store
      const tracks = $localTracks
      const permitEntry = $permitEntry
      const r = { conference, tracks, permitEntry }
      return r
    }
  ).subscribe(($props) => {
    if ($props.conference && $props.tracks && $props.permitEntry) {
      // Whenever local tracks exist, add them to the localParticipant for this conference
      // (Allows this participant to see self)
      localParticipantStore.addTrack($props.tracks.audio)
      localParticipantStore.addTrack($props.tracks.video)

      const tracksList = Object.values($props.tracks)
      // When conference & local tracks exist, add local tracks to the conference
      // (Allows others to see this participant)
      addLocalTracksToConference($props.conference, tracksList)
    } else {
      // TODO: remove local tracks?
    }
  })

  /**
   * A store containing all participant stores, both local and remote.
   *
   * This derives from `store` because we need to guarantee that there is
   * at least one subscriber to `store`, so that the conference is joined.
   */
  const allParticipantsStore = derived(
    [
      localParticipantStore,
      remoteParticipantsStore,
      store /* ConferenceStore */,
    ],
    ([$localParticipant, $remoteParticipants, $store], set) => {
      if ($store) {
        const allParticipants = {}

        // Add remote participants
        for (let [participantId, remoteParticipantStore] of Object.entries(
          $remoteParticipants
        )) {
          if (get(remoteParticipantStore).jid) {
            allParticipants[participantId] = remoteParticipantStore
          }
        }

        // Add local participant, if present
        if ($localParticipant && $localParticipant.jid) {
          allParticipants[$localParticipant.jid] = localParticipantStore
        }

        set(allParticipants)
      } else {
        // If the ConferenceStore is null, then we consider the conference to have no participants
        set({})
      }
    },
    // Initial allParticipantsStore value
    {}
  )

  return {
    subscribe: store.subscribe,
    state: stateStore,
    participants: allParticipantsStore,
    permitEntry: (permit) => {
      permitEntryStore.set(permit)
    },
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
