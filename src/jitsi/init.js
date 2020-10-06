// Global JitsiMeetJS Init
//
// Note: this needs to run just once, but it must run or there can be
//   unusual errors, e.g.
//   https://community.jitsi.org/t/why-is-rtcutils-missing-enumeratedevices/79005/3

JitsiMeetJS.setLogLevel(JitsiMeetJS.logLevels.ERROR)

JitsiMeetJS.init({
  audioLevelsInterval: 40,
  disableAudioLevels: false,
})
