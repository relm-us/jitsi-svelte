<script>
  import { createConnectionStore, defaultConfigStore } from './index.js'
  import Conference from '/components/Conference'
  import Mirror from '/components/Mirror'

  let mirrorPage = true

  const connection = createConnectionStore(defaultConfigStore)

  const conferences = connection.conferencesStore

  conferences.join('jitsi-svelte-test')
</script>

{#if mirrorPage}
  <div class="centered">
    <p>You're about to join a video meeting</p>
    <Mirror on:done={() => (mirrorPage = false)} />
  </div>
{/if}
<div>{$connection ? 'Connected' : 'Not Connected'}</div>

{#each Object.entries($conferences) as [conferenceId, conference], key}
  <Conference {conferenceId} {conference} />
  <button on:click={() => conferences.leave(conferenceId)}>Leave Conference</button>
{/each}

<style>
  .centered {
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: center;
  }
</style>
