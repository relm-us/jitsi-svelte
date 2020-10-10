<script>
  import { onMount, afterUpdate, onDestroy } from 'svelte'
  import { writable, derived, get } from 'svelte/store'
  import { uuidv4 } from '../../utils/uuid.js'

  export let id = uuidv4()
  export let autoPlay = true
  export let fullscreen = false
  // iOS needs this so the video doesn't automatically play full screen
  export let playsInline = true
  export let track = null
  export let mirror = false

  let attachedTrack
  let videoElement

  const videoElementStore = writable(null)
  const trackStore = writable(null)

  const ATTACH_AFTER_MOUNT_DELAY = 1000
  const SUSPEND_CALLBACK_DELAY = 3000

  const detach = () => {
    if (attachedTrack) {
      attachedTrack.detach(videoElement)
      attachedTrack = null
    }
  }

  const attach = () => {
    if (track && track !== attachedTrack) {
      detach()
      attachedTrack = track
      track.attach(videoElement)
    }
  }

  onMount(() => {
    videoElementStore.set(videoElement)
  })

  afterUpdate(() => {
    if (track !== get(trackStore)) {
      trackStore.set(track)
    }
  })

  derived([videoElementStore, trackStore], ([$videoElement, $track]) => {
    return { videoElement: $videoElement, track: $track }
  }).subscribe(($props) => {
    if ($props.videoElement && $props.track) {
      attach()
    }
  })
  onDestroy(detach)
</script>

<!-- Note:
  A number of video attributes are HTML "Boolean attributes", so to prevent the 
  attribute key from being incorrectly rendered, Svelte needs the value to be
  `undefined` when false:
  - autoplay
  - playsinline
  - disablepictureinpicture
-->
<!-- svelte-ignore a11y-media-has-caption -->
<video
  bind:this={videoElement}
  class:mirror
  class:fullscreen
  {id}
  autoPlay={autoPlay ? true : undefined}
  playsInline={playsInline ? true : undefined}
  disablePictureInPicture="" />

<style>
  video {
    object-fit: cover;
    width: 100%;
    height: 100%;
  }
  video.mirror {
    transform: scaleX(-1);
  }
  .video.fullscreen {
    width: 100%;
    height: 100%;
  }
</style>
