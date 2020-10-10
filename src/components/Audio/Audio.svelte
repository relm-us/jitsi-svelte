<script>
  import { afterUpdate, onDestroy } from 'svelte'
  import { uuidv4 } from '../../utils/uuid.js'
  import { createElementAndTrackStore } from '../../stores/ElementTrackStore.js'

  export let id = uuidv4()
  export let loop = false
  export let autoPlay = true
  export let track = undefined

  let audioElement

  const store = createElementAndTrackStore()

  onMount(() => store.setElement(audioElement))

  afterUpdate(() => store.setTrack(track))

  onDestroy(store.destroy)
</script>

<!-- Note:
  A number of audio attributes are HTML "Boolean attributes", so to prevent the 
  attribute key from being rendered, Svelte needs the value to be `undefined` when false:
  - autoplay
  - loop
-->
<!-- svelte-ignore a11y-media-has-caption -->
<audio
  bind:this={audioElement}
  {id}
  loop={loop ? true : undefined}
  autoPlay={autoPlay ? true : undefined} />
