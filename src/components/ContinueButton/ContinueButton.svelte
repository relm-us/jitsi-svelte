<script>
  import { createEventDispatcher } from 'svelte'

  export let enabled = true

  let dispatch = createEventDispatcher()
</script>

<button
  class="continue"
  class:disabled={!enabled}
  on:click={() => {
    dispatch('click')
  }}>
  <slot>Continue</slot>
</button>

<style>
  .continue {
    display: block;
    margin: 32px auto;
    border: 0;
    background-color: #ffa833;
    color: #643;
    padding: 12px 18px;
    border-radius: 8px;
    font-size: 24px;
    font-weight: bold;
    box-shadow: 0px 0px 2px 0px rgba(0, 0, 0, 0.5);
    cursor: pointer;
  }
  .continue.disabled {
    pointer-events: none;
    opacity: 0.3;
  }
  .continue:hover {
    background-color: #ffb840;
  }
  .continue:active {
    transform: translateY(1px);
  }
</style>
