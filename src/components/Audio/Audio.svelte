<script>
  import { afterUpdate, onDestroy } from 'svelte'
  import { uuidv4 } from '../../utils/uuid.js'

  export let id = uuidv4()
  export let loop = false
  export let autoPlay = true
  export let track = undefined

  let attachedTrack
  let audioElement

  const detach = () => {
    const track = attachedTrack
    if (track && track.detach) {
      track.detach(audioElement)
    }
  }

  const attach = (track) => {
    if (track === attachedTrack) {
      return
    }
    if (attachedTrack) {
      detach()
    }
    if (track && track.attach) {
      attachedTrack = track
      track.attach(audioElement)
    }
  }

  onDestroy(detach)

  afterUpdate(() => {
    attach(track)
  })
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
