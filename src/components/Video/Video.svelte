<script>
  import { onMount, afterUpdate, onDestroy } from 'svelte'
  import { uuidv4 } from '/utils/uuid.js'

  const ENABLE_CHROME_RESUME = false

  export let id = uuidv4()
  export let autoPlay = true
  export let fullscreen = false
  // iOS needs this so the video doesn't automatically play full screen
  export let playsInline = true
  export let track = undefined
  export let mirror = false
  export let onSuspend = null

  let attachedTrack
  let videoElement

  const ATTACH_AFTER_MOUNT_DELAY = 1000
  const SUSPEND_CALLBACK_DELAY = 3000

  const detach = () => {
    const track = attachedTrack
    if (track && track.detach) {
      track.detach(videoElement)
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
      track.attach(videoElement)
    }
  }

  onDestroy(detach)

  afterUpdate(() => {
    attach(track)
  })

  onMount(() => {
    window.video = videoElement

    if (ENABLE_CHROME_RESUME) {
      /**
       * On Chrome, the video stream is cut (goes black) whenever the OS suspends/
       * resumes. We use a little hack here to restore the video stream on resume.
       *
       * Since Chrome uses the 'suspend' callback after the OS resumes, we can use
       * it to restore the video stream. However, on Firefox the 'suspend' callback
       * happens whenever the `video` tag is mounted. So we ignore 'suspend' events
       * that occur right after mount, and heed 'suspend' events that happen there-
       * after.
       */
      setTimeout(() => {
        videoElement.addEventListener('suspend', () => {
          if (onSuspend) {
            console.log(
              `Attempting to restore video after ${
                SUSPEND_CALLBACK_DELAY / 1000
              } seconds...`
            )
            setTimeout(onSuspend, SUSPEND_CALLBACK_DELAY)
          }
        })
      }, ATTACH_AFTER_MOUNT_DELAY)
    }
  })
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
