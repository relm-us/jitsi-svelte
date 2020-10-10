<script>
  import { onMount, afterUpdate, onDestroy } from 'svelte'
  import { uuidv4 } from '../../utils/uuid.js'
  import { createElementAndTrackStore } from '../../stores/ElementTrackStore.js'

  export let id = uuidv4()
  export let autoPlay = true
  export let fullscreen = false
  // iOS needs this so the video doesn't automatically play full screen
  export let playsInline = true
  export let track = null
  export let mirror = false

  let videoElement

  const store = createElementAndTrackStore()

  onMount(() => store.setElement(videoElement))

  afterUpdate(() => store.setTrack(track))

  onDestroy(store.destroy)
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
  .mirror {
    transform: scaleX(-1);
  }
  .fullscreen {
    width: 100%;
    height: 100%;
  }
</style>
