async function canAutoPermit() {
  return new Promise((resolve) => {
    // If the browser allows us to enumerate any of the devices, then
    // there is at least some "permission" granted by the user from
    // the last time they visited. Take the hint and attempt to request
    // full permission to use audio & video.
    if (JitsiMeetJS.mediaDevices.isDeviceListAvailable()) {
      JitsiMeetJS.mediaDevices.enumerateDevices((deviceList) => {
        let autoPermit = false
        for (const device of deviceList) {
          if (device.label) autoPermit = true
        }
        resolve(autoPermit)
      })
    } else {
      resolve(false)
    }
  })
}

export default canAutoPermit
