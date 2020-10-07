<script>
  import {
    createConnectionStore,
    defaultConfigStore,
    Mirror,
  } from 'jitsi-svelte'

  import Conference from './Conference'

  let mirrorPage = true

  // Note that as soon as you provide a ConfigStore for the connection, it will connect.
  // If you want to delay connecting until some future point, just use 'null' as the store.
  const connection = createConnectionStore(defaultConfigStore)

  const conferences = connection.conferencesStore

  // The conference room to join. You can join now or later (e.g. after some action). You
  // can join multiple conferences simultaneously. Joining a conference is independent of
  // actually sharing your video/audio--the Mirror page lets the user set up their video/
  // audio and share it with the conference room.
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
  p {
    font-family: Verdana, Geneva, Tahoma, sans-serif;
  }
  .centered {
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: center;
  }
</style>
