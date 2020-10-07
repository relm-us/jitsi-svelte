import { writable, derived } from 'svelte/store'

import ready from '/utils/ready.js'

/**
 * The DeviceListStore is responsible for being an up-to-date list of media devices
 * available to the app.
 *
 * Available means:
 *   1. There is sufficient permission granted by the user (via the browser's getUserMedia call)
 *   2. The device is plugged in and listed by the browser
 */

const { DEVICE_LIST_CHANGED } = JitsiMeetJS.events.mediaDevices
const { mediaDevices } = JitsiMeetJS

async function getDeviceList() {
  return new Promise((resolve, reject) => {
    if (JitsiMeetJS.mediaDevices.isDeviceListAvailable()) {
      JitsiMeetJS.mediaDevices.enumerateDevices((deviceList) =>
        resolve(deviceList)
      )
    } else {
      reject(new Error('Device List not available'))
    }
  })
}

function createDeviceListStore() {
  const { subscribe, set } = writable([])

  // Sets the deviceList array, and augments with pseudo-devices if needed
  const setDeviceList = (deviceList_) => {
    // Clone the deviceList so we aren't modifying the original
    const deviceList = deviceList_.slice()

    // In some browsers such as Firefox, the audiooutput is not listed
    // when there is just one default device, so create a pseudo-device
    const atLeastOneAudioOutputDevice = !!deviceList.find(
      (device) => device.kind === 'audiooutput'
    )

    if (!atLeastOneAudioOutputDevice) {
      deviceList.push({
        deviceId: 'default',
        kind: 'audiooutput',
        label: 'Default Speakers',
      })
    }

    set(deviceList)
  }

  // Initialize the deviceList with whatever the browser will tell us at this time
  ready(() => {
    getDeviceList().then(setDeviceList)
  })

  // Whenever there is a device change event, update the store
  mediaDevices.addEventListener(DEVICE_LIST_CHANGED, setDeviceList)

  return {
    // DeviceList behaves as a Svelte-subscribable store
    subscribe,

    // DeviceList can be set, e.g. on callbacks and events returned by Jitsi
    set: setDeviceList,

    // Instruct DeviceList to ask the browser for its most recent enumeration of devices
    requery: async () => {
      const deviceList = await getDeviceList()
      setDeviceList(deviceList)
      return deviceList
    },
  }
}

// The default store containing an array of MediaDeviceInfo devices
const deviceList = createDeviceListStore()

// Given a deviceList, pick out the most likely default device of a certain kind
function getDefaultDeviceId(deviceList, kind) {
  const deviceListOfKind = deviceList.filter((device) => device.kind === kind)
  const defaultDevice = deviceListOfKind.find((d) => d.deviceId === 'default')

  let matchingDevice

  if (defaultDevice) {
    // Find the device with a matching group id.
    matchingDevice = deviceListOfKind.find(
      (d) => d.deviceId !== 'default' && d.groupId === defaultDevice.groupId
    )
  }

  if (matchingDevice) {
    return matchingDevice.deviceId
  } else if (deviceListOfKind.length >= 1) {
    return deviceListOfKind[0].deviceId
  } else {
    return null
  }
}

const defaultDevices = derived(deviceList, ($deviceList) => {
  return {
    videoinput: getDefaultDeviceId($deviceList, 'videoinput'),
    audioinput: getDefaultDeviceId($deviceList, 'audioinput'),
    audiooutput: getDefaultDeviceId($deviceList, 'audiooutput'),
  }
})

const selectedDevices = writable({})

export { deviceList, defaultDevices, selectedDevices }
