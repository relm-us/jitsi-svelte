<script>
  import { onMount, createEventDispatcher } from 'svelte'
  import { spring } from 'svelte/motion'

  import canAutoPermit from '/jitsi/canAutoPermit.js'
  import { deviceList, selectedDevices } from '/stores/DeviceListStore.js'
  import {
    localTracks,
    localAudioLevel,
    requestedTracks,
  } from '/stores/LocalTrackStore.js'

  import Video from '/components/Video'
  import Audio from '/components/Audio'
  import ContinueButton from '/components/ContinueButton'

  import DeviceSelector from './DeviceSelector'

  import videoEnabledIcon from './images/video-enabled.svg'
  import videoDisabledIcon from './images/video-disabled.svg'
  import audioEnabledIcon from './images/audio-enabled.svg'
  import audioDisabledIcon from './images/audio-disabled.svg'
  import settingsIcon from './images/settings.svg'

  const AUDIO_LEVEL_MINIMUM = 0.0

  const dispatch = createEventDispatcher()

  const audioRequested = requestedTracks.audio
  const videoRequested = requestedTracks.video

  // Local state
  let requestBlocked = false
  let letMeHearMyself = false

  let hasPermission = false
  let advancedSettings = false
  let advancedSettingsSupported = JitsiMeetJS.util.browser.isChrome()

  // Animation springs
  let audioLevelSpring = spring(0, {
    stiffness: 0.3,
    damping: 0.8,
  })

  let videoPositionSpring = spring(0, {
    stiffness: 0.5,
    damping: 0.3,
  })
  const shakeInactiveVideo = () => {
    videoPositionSpring.set(10)
    setTimeout(() => videoPositionSpring.set(0), 100)
  }

  const toggleAudioRequested = () => ($audioRequested = !$audioRequested)

  const toggleVideoRequested = () => ($videoRequested = !$videoRequested)

  const toggleAdvancedSettings = () => (advancedSettings = !advancedSettings)

  // const audioLevelChanged = (level) => audioLevelSpring.set(level)
  $: audioLevelSpring.set($localAudioLevel)

  function setRequestBlocked(blocked) {
    if (blocked) {
      if (requestBlocked) {
        // Visual feedback already indicates red,
        // so shake it to emphasize error
        shakeInactiveVideo()
      }
      requestBlocked = true
    } else {
      requestBlocked = false
    }
  }

  /**
   * localTracks, audioRequested, videoRequested
   * @returns hasPermission, blocked(?), tracks
   */
  async function requestPermissions() {
    hasPermission = await localTracks.request()

    // Visually indicate that the request was blocked if we don't have permission
    setRequestBlocked(!hasPermission)

    // After asking for permission, it's possible the browser will now allow us
    // to see more information about the devices available to the user, so requery
    await deviceList.requery()
  }

  const handleDone = () => {
    dispatch('done')
  }

  const handleHelp = () => {
    alert('TODO')
  }

  onMount(async () => {
    const autoPermit = await canAutoPermit()
    if (autoPermit) {
      requestPermissions()
    }
  })
</script>

<div class="mirror">
  {#if hasPermission}
    <div class="video-box">
      {#if letMeHearMyself}
        <Audio track={$localTracks.audio} />
      {/if}
      <Video track={$localTracks.video} mirror={true} />
      <div class="video-stack overlay">
        {#if !$audioRequested && !$videoRequested}
          <div class="message">Join with cam and mic off</div>
        {:else if !$videoRequested}
          <div class="message">Join with cam off</div>
        {:else if !$audioRequested}
          <div class="message">Join with mic off</div>
        {:else}
          <div />
        {/if}
        <div class="button-tray">
          <button
            on:click={toggleVideoRequested}
            class:track-disabled={!$videoRequested}>
            {#if $videoRequested}
              <img src={videoEnabledIcon} width="32" alt="Video Enabled" />
            {:else}
              <img src={videoDisabledIcon} width="32" alt="Video Disabled" />
            {/if}
          </button>
          <button
            on:click={toggleAudioRequested}
            class:audio-level={$audioRequested && $audioLevelSpring > AUDIO_LEVEL_MINIMUM}
            class:track-disabled={!$audioRequested}
            style="--audio-level:{($audioLevelSpring * 85 + 15).toFixed(2) + '%'}">
            {#if $audioRequested}
              <img src={audioEnabledIcon} width="32" alt="Audio Enabled" />
            {:else}
              <img src={audioDisabledIcon} width="32" alt="Audio Disabled" />
            {/if}
          </button>
          {#if advancedSettingsSupported}
            <button class="corner" on:click={toggleAdvancedSettings}><img
                src={settingsIcon}
                width="32"
                alt="Settings" /></button>
          {/if}
        </div>
      </div>
    </div>
    <ContinueButton on:click={handleDone}>Continue</ContinueButton>
    {#if advancedSettings}
      <div class="advanced-settings">
        <DeviceSelector
          selected={selectedDevices}
          on:changed={(_) => {
            requestPermissions()
          }} />
      </div>
    {/if}
  {:else}
    <div
      class="video-stack filled"
      class:blocked={requestBlocked}
      style="transform: translate({$videoPositionSpring}px, 0)">
      <div class="image">
        <img src={videoDisabledIcon} width="75" alt="Video Disabled" />
      </div>
      <div class="message">
        {#if requestBlocked}
          Cam and mic are blocked
          <button on:click={handleHelp}>(Need help?)</button>
        {:else}Cam and mic are not active{/if}
      </div>
    </div>

    <p>
      For others to see and hear you, your browser will request access to your
      cam and mic.
    </p>

    <ContinueButton on:click={requestPermissions}>
      {#if requestBlocked}Try Again{:else}Request Permissions{/if}
    </ContinueButton>
  {/if}
</div>

<style>
  .mirror {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 500px;
  }
  p {
    width: 375px;
    text-align: center;
  }
  .video-box {
    display: flex;
    justify-content: center;

    overflow: hidden;
    border-radius: 10px;
    width: 375px;
    height: 225px;

    background-color: #555;
  }
  .video-stack {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    overflow: hidden;

    border-radius: 10px;
    width: 375px;
    height: 225px;
  }
  .video-stack.overlay {
    position: absolute;
  }
  .video-stack.filled {
    background-color: #555;
  }
  .video-stack.blocked {
    background-color: #f55;
  }
  .video-stack .image {
    display: flex;
    justify-content: center;
    flex-grow: 1;
    margin-top: 15px;
  }
  .video-stack .message {
    color: #eee;
    background-color: rgba(33, 33, 33, 0.5);
    border-radius: 10px;
    padding: 8px 15px;
    margin: 8px;
    text-align: center;

    font-family: Verdana, Geneva, Tahoma, sans-serif;
  }
  .video-stack .message button {
    border: none;
    background: none;
    text-decoration: underline;
    cursor: pointer;
    color: white;
  }
  .video-stack .button-tray {
    display: flex;
    flex-direction: row;
    justify-content: center;
  }
  .button-tray button {
    display: flex;

    color: white;
    background-color: rgba(33, 33, 33, 0.5);
    border: none;
    border-radius: 8px;
    margin: 8px;

    font-size: 18px;
    font-family: Verdana, Geneva, Tahoma, sans-serif;
    padding: 8px 15px;
  }
  .button-tray button img {
    z-index: 1;
  }
  .button-tray button.track-disabled {
    background-color: rgba(255, 85, 85, 0.7);
  }
  .button-tray button:hover {
    background-color: rgba(85, 85, 85, 0.7);
  }
  .button-tray button.track-disabled:hover {
    background-color: rgba(255, 115, 115, 0.7);
  }
  .button-tray button.corner {
    position: absolute;
    right: 10px;
  }
  .video-stack.blocked .message {
    background-color: #822;
  }
  /* button:active {
    transform: translateY(1px);
  }
  button.main-action {
    color: white;
    background-color: rgba(70, 130, 180, 1);
    border: 0;
    border-radius: 8px;
    margin-top: 15px;
    padding: 8px 15px;
    font-size: 18px;
    font-weight: bold;
    cursor: pointer;
  }
  button.main-action:hover {
    background-color: rgba(103, 152, 193, 1);
  } */
  .minor-action {
    margin-top: 8px;
  }
  .minor-action button {
    border: none;
    background: none;
    text-decoration: underline;
    cursor: pointer;
  }
  .audio-level {
    position: relative;
  }
  .audio-level:before {
    content: ' ';
    display: block;
    position: absolute;
    width: 100%;
    height: var(--audio-level);
    max-height: 100%;
    bottom: 0;
    left: 0;
    background-color: rgba(70, 180, 74, 0.7);
    border-bottom-right-radius: 8px;
    border-bottom-left-radius: 8px;
  }
</style>
