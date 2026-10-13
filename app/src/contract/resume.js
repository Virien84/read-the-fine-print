// After the GPU is lost, Chrome won't hand this page a GPU again until it
// reloads, so a review in progress is parked in the tab's session storage and
// picked up after the reload. Storage can be unavailable; then the user just
// starts again.
const KEY = 'resumeReview'

export function parkReview(review) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(review))
    return true
  } catch {
    return false
  }
}

export function takeParkedReview() {
  try {
    const review = JSON.parse(sessionStorage.getItem(KEY))
    sessionStorage.removeItem(KEY)
    return review
  } catch {
    return null
  }
}
