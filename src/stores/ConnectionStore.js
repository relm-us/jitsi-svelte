import { writable, get } from 'svelte/store'
import { createConferencesStore } from './ConferencesStore.js'
import { wireEventListeners } from '../utils/events.js'

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

export const DEFAULT_JITSI_CONFIG = {
  hosts: {
    domain: 'meet.jit.si',
    muc: 'conference.meet.jit.si',
    focus: 'focus.meet.jit.si',
  },
  externalConnectUrl: 'https://meet.jit.si/http-pre-bind',
  enableP2P: true,
  p2p: {
    enabled: true,
    preferH264: true,
    disableH264: true,
    useStunTurn: true,
  },
  useStunTurn: true,
  bosh: `https://meet.jit.si/http-bind`, // need to add `room=[ROOM]` when joining
  websocket: 'wss://meet.jit.si/xmpp-websocket',
  clientNode: 'http://jitsi.org/jitsimeet',
}

/**
 * Create a ConnectionStore that holds a single JitsiConnection instance when connected,
 * or `null` otherwise.
 *
 * If the config inside `configStore` is null, then disconnect.
 *
 * @param {ConfigStore} configStore
 */
function createConnectionStore(config, room) {
  if (!config) {
    throw Error('Jitsi connection config required')
  }

  config.bosh += `?room=${room}`

  const stateStore = writable(ConnectState.INITIAL)

  const qualityStore = writable(0.0)

  const store = writable()

  const connection = new JitsiMeetJS.JitsiConnection(null, null, config)

  const setStatus = (state) => {
    store.set(state === ConnectState.CONNECTED ? connection : null)
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

  const disconnect = () => {
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

  const conferencesStore = createConferencesStore(store)
  return {
    subscribe: store.subscribe,
    state: stateStore,
    quality: qualityStore,

    // Each connection can have multiple conferences (rooms)
    conferencesStore: conferencesStore,

    joinConference: (conferenceId) => conferencesStore.join(conferenceId),
    disconnect,
  }
}

export { createConnectionStore, ConnectState }
