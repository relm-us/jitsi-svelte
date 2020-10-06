<script>
  import { createConnectionStore, defaultConfigStore } from './index.js'

  const connection = createConnectionStore(defaultConfigStore)
</script>

<div>{$connection ? 'connection' : 'null'}</div>
