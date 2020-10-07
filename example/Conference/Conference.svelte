<script>
  import Participant from '../Participant'

  export let conferenceId
  export let conference

  const participants = conference.participants
  const status = conference.state
</script>

<div class="container">
  <div>Conference Room: {conferenceId}</div>
  <div>Status: {$status}</div>
  <div>
    Participants:
    {#each Object.entries($participants) as [participantId, participant], key}
      <Participant {participantId} {participant} />
    {/each}
  </div>
</div>

<style>
  .container {
    margin-left: 2em;
    margin-bottom: 1em;
  }
</style>
