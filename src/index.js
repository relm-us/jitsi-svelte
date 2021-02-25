export { default as Audio } from './components/Audio/Audio.svelte'
export { default as Video } from './components/Video/Video.svelte'
export { default as Mirror } from './components/Mirror/Mirror.svelte'

export { default as canAutoPermit } from './jitsi/canAutoPermit.js'

export { localTracksStore } from './stores/LocalTracksStore.js'
export {
  createConnectionStore,
  DEFAULT_JITSI_CONFIG,
} from './stores/ConnectionStore.js'
