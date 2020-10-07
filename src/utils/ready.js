function ready(fn) {
  if (document.readyState === 'complete') {
    fn()
  } else {
    document.addEventListener('readystatechange', () => {
      if (document.readyState === 'complete') {
        fn()
      }
    })
  }
}

export default ready
