import { writable, derived, get } from 'svelte/store'
import { createConferencesStore } from './ConferencesStore.js'
import { wireEventListeners } from '/utils/events.js'

import '../jitsi/init.js'

const ConnectState = {
  INITIAL: 'initial',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  DISCONNECTING: 'disconnecting',
  DISCONNECTED: 'disconnected',
  FAILED: 'failed',
}

const CLEANUP_EVENT_LISTENERS_MAX_TIMEOUT = 4000

/**
 * Create a ConnectionStore that holds a single JitsiConnection instance when connected,
 * or `null` otherwise.
 *
 * If the config inside `configStore` is null, then disconnect.
 *
 * @param {ConfigStore} configStore
 */
function createConnectionStore(configStore) {
  if (!configStore) {
    throw Error('Jitsi connection config required')
  }

  const stateStore = writable(ConnectState.INITIAL)

  const qualityStore = writable(0.0)

  const store = derived(
    configStore,
    ($config, set) => {
      if ($config) {
        const connection = new JitsiMeetJS.JitsiConnection(null, null, $config)

        const setStatus = (state) => {
          set(state === ConnectState.CONNECTED ? connection : null)
          stateStore.set(state)
        }

        const events = {
          connection: {
            CONNECTION_ESTABLISHED: () => setStatus(ConnectState.CONNECTED),
            CONNECTION_FAILED: () => setStatus(ConnectState.FAILED),
            CONNECTION_DISCONNECTED: () => {
              wireEventListeners('remove', connection, events)
              setStatus(ConnectState.DISCONNECTED)
            },
            WRONG_STATE: () => {
              console.error('Jitsi Connection: Wrong State')
              setStatus(ConnectState.FAILED)
            },
          },
          connectionQuality: {
            LOCAL_STATS_UPDATED: ({ connectionQuality }) => {
              // TODO: check that this is working when conference has been joined
              console.log('LOCAL_STATS_UPDATED', connectionQuality)
              qualityStore.set(connectionQuality)
            },
          },
        }

        wireEventListeners('add', connection, events)

        setStatus(ConnectState.CONNECTING)
        connection.connect()

        // When config changes, clean up before re-creating a new JitsiConnection
        return () => {
          // If connected, disconnect
          const $state = get(stateStore)
          if (
            $state === ConnectState.CONNECTING ||
            $state === ConnectState.CONNECTED
          ) {
            // Disconnect from the server
            setStatus(ConnectState.DISCONNECTING)
            connection.disconnect()

            /**
             * Make sure we clean up event listeners.
             *
             * NOTE: Hopefully this will have been taken care of by
             *       the CONNECTION_DISCONNECTED event, but if not
             *       this will be our fallback, e.g. in the case of
             *       CONNECTION_FAILED or other states.
             */
            setTimeout(
              () => wireEventListeners('remove', connection, events),
              CLEANUP_EVENT_LISTENERS_MAX_TIMEOUT
            )
          } else {
            // Whether or not we're connected, we must still clean up event listeners
            wireEventListeners('remove', connection, events)
          }
        }
      }
    },

    // Initial derived store value
    null
  )

  return {
    subscribe: store.subscribe,
    state: stateStore,
    quality: qualityStore,

    // Each connection can have multiple conferences (rooms)
    conferencesStore: createConferencesStore(store),
  }
}

export { createConnectionStore, ConnectState }
