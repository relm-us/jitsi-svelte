# jitsi-svelte

Jitsi is a free, open-source, web-based video conferencing app that has a handy library called lib-jitsi-meet. This library allows you to create your own custom Jitsi client. However, there are quite a few intricacies to getting it working well, and if you're writing a Svelte3-based app, there is some complexity in getting all of the events to work together.

`jitsi-svelte` simplifies all of this and provides the svelte stores you need to build a web-based video conferencing app. We use it at [Relm](http://www.relm.us) to power our social virtual world.

We were inspired by Whereby's intro screen and created what we call the "Mirror" component that mimics their UX & design. This `Mirror` can reduce the code you need to write to give a robust setup screen experience for your users.

# Getting Started

See the `example/` folder for a sample app that uses `jitsi-svelte`.

In general, you need to create a ConnectionStore via `createConnectionStore` and supply a `JitsiConfigStore` as the parameter; then, join a conference (at this point, the user will see others who've already entered the room), and use a `Mirror` component to let the user configure their mic and camera before entering the room.

```javascript
import {
  createConnectionStore,
  defaultConfigStore,
  Mirror,
} from 'jitsi-svelte'

import Conference from './Conference'

const connection = createConnectionStore(defaultConfigStore)

connection.conferences.join('jitsi-svelte-test')

// NEXT: use Mirror svelte component (see SampleApp.svelte)
```

# License

MIT

# What is Relm?

Relm is a social universe--a kinder, gentler online community. It's an experiment in mixing a game world with work meetings. Come visit sometime! https://www.relm.us
