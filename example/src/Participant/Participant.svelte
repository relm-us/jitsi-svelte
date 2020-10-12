<script>
  import { Video } from 'jitsi-svelte'

  export let participant
</script>

<div class="container">
  <div class="left">
    <table>
      <tr>
        <td class="label">Local:</td>
        <td>{$participant.isLocal}</td>
      </tr>
      <tr>
        <td class="label">Jitsi ID:</td>
        <td>{$participant.jid}</td>
      </tr>
      <tr>
        <td class="label">Role:</td>
        <td>{$participant.role}</td>
      </tr>
      <tr>
        <td class="label">Audio Level:</td>
        <td>{$participant.audioLevel}</td>
      </tr>
      <tr>
        <td class="label">Audio:</td>
        <td>{$participant.audioEnabled ? 'enabled' : 'disabled'}</td>
        <td>
          {#if $participant.audioEnabled}
            <button
              on:click={() => participant.setAudioEnabled(false)}>mute</button>
          {:else}
            <button
              on:click={() => participant.setAudioEnabled(true)}>unmute</button>
          {/if}
        </td>
      </tr>
      <tr>
        <td class="label">Video:</td>
        <td>{$participant.videoEnabled ? 'enabled' : 'disabled'}</td>
        <td>
          {#if $participant.videoEnabled}
            <button
              on:click={() => participant.setVideoEnabled(false)}>mute</button>
          {:else}
            <button
              on:click={() => participant.setVideoEnabled(true)}>unmute</button>
          {/if}
        </td>
      </tr>
      <tr>
        <td class="label">Desktop:</td>
        <td>{$participant.desktopEnabled ? 'enabled' : 'disabled'}</td>
        <td>
          {#if $participant.desktopEnabled}
            <button
              on:click={() => participant.setDesktopEnabled(false)}>mute</button>
          {:else}
            <button
              on:click={() => participant.setDesktopEnabled(true)}>unmute</button>
          {/if}
        </td>
      </tr>
    </table>
  </div>
  <div class="right">
    {#if $participant.video}
      <div class="video">
        <Video track={$participant.video} mirror={$participant.isLocal} />
      </div>
    {/if}
    {#if $participant.desktop}
      <div class="video">
        <Video track={$participant.desktop} />
      </div>
    {/if}
  </div>
</div>

<style>
  .container {
    display: flex;
    flex-direction: row;

    margin-top: 1em;
    margin-left: 2em;
    margin-bottom: 1em;
    border: 1px solid #ddd;

    width: 600px;
  }
  .left,
  .right {
    width: 50%;
  }
  .video {
    width: 300px;
    height: 300px;
    display: flex;
    object-fit: contain;
  }
  table {
    margin: 8px;
  }
  td {
    padding: 4px;
  }
  td.label {
    font-weight: bold;
  }
</style>
