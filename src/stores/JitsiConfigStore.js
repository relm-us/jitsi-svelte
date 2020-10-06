import { writable } from 'svelte/store'

const DEFAULT_JITSI_CONFIG = {
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
  serviceUrl: 'https://meet.jit.si/http-bind',
  websocket: 'wss://meet.jit.si/xmpp-websocket',
  clientNode: 'http://jitsi.org/jitsimeet',
}

function createJitsiConfigStore(config) {
  const store = writable(config || null)

  const { subscribe, update, set } = store

  return { subscribe, update, set }
}

const defaultConfigStore = createJitsiConfigStore(DEFAULT_JITSI_CONFIG)

export { defaultConfigStore, createJitsiConfigStore, DEFAULT_JITSI_CONFIG }
