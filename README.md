# jitsi-svelte

This library allows you to easily create your own custom [Jitsi](https://jitsi.org/jitsi-meet/) client, in the [Svelte](https://svelte.dev/) framework.

Jitsi is a free, open-source, web-based video conferencing app that has a handy library called lib-jitsi-meet. However, there are quite a few intricacies to getting it working well, and if you're writing a Svelte3-based app, there is some additional complexity in getting all of the events to work together.

`jitsi-svelte` simplifies all of this and provides the svelte stores you need to build a web-based video conferencing app. It also provides Svelte components for Audio, and Video, among others. We use it at [Relm](http://www.relm.us) to power our social virtual world.

<div align="center">
  <img src="images/screenshot.png" width="350" alt="Simplified Cam/Mic Setup">
</div>

We were inspired by Whereby's intro screen and created what we call the "Mirror" component that mimics their UX & design. This `Mirror` can reduce the code you need to write to give a robust setup screen experience for your users.

# Getting Started

See the `example/` folder for a sample app that uses `jitsi-svelte`.

In general, you need to create a ConnectionStore via `createConnectionStore` and supply a `JitsiConfig` as the parameter; then, join a conference (at this point, the user will see others who've already entered the room), and use a `Mirror` component to let the user configure their mic and camera before entering the room.

```javascript
import { createConnectionStore, DEFAULT_JITSI_CONFIG, Mirror } from 'jitsi-svelte'

import Conference from './Conference'

const connection = createConnectionStore(DEFAULT_JITSI_CONFIG, 'jitsi-svelte-test')

connection.conferences.join('jitsi-svelte-test')

// NEXT: use Mirror svelte component (see SampleApp.svelte)
```

# License

MIT

# What is Relm?

Relm is a social universe--a kinder, gentler online community. It's an experiment in mixing a game world with work meetings. Come visit sometime! https://www.relm.us
