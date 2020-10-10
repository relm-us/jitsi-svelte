/**
 * Attach a set of local tracks to a conference.
 *
 * @param {JitsiConference} conference - Conference instance.
 * @param {JitsiLocalTrack[]} localTracks - List of local media tracks.
 * @protected
 * @returns {Promise}
 */
function addLocalTracksToConference(conference, localTracks) {
  const conferenceLocalTracks = conference.getLocalTracks()
  const promises = []

  for (const track of localTracks) {
    // XXX The library lib-jitsi-meet may be draconian, for example, when
    // adding one and the same video track multiple times.
    if (conferenceLocalTracks.indexOf(track) === -1) {
      promises.push(
        conference.addTrack(track).catch((err) => {
          console.warn('Failed to add local track to conference', err)
        })
      )
    }
  }

  return Promise.all(promises)
}

/**
 * Remove a set of local tracks from a conference.
 *
 * @param {JitsiConference} conference - Conference instance.
 * @param {JitsiLocalTrack[]} localTracks - List of local media tracks.
 * @protected
 * @returns {Promise}
 */
function removeLocalTracksFromConference(conference, localTracks) {
  return Promise.all(
    localTracks.map((track) =>
      conference.removeTrack(track).catch((err) => {
        // Local track might be already disposed by direct
        // JitsiTrack#dispose() call. So we should ignore this error
        // here.
        if (err.name !== JitsiTrackErrors.TRACK_IS_DISPOSED) {
          console.warn('Failed to remove local track from conference', err)
        }
      })
    )
  )
}

export { addLocalTracksToConference, removeLocalTracksFromConference }
