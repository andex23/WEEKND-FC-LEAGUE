function shouldSendApprovalConfirmationEmail(player, nextStatus) {
  return (
    normalizeStatus(nextStatus) === "approved" &&
    normalizeStatus(player?.status) !== "approved" &&
    hasEmail(player?.email)
  )
}

function normalizeStatus(status) {
  return String(status || "pending").toLowerCase()
}

function hasEmail(email) {
  return Boolean(email && email.includes("@"))
}

exports.shouldSendApprovalConfirmationEmail = shouldSendApprovalConfirmationEmail
