async function getAllPasswordRequests() {
  const items = await trickleListAll('password_request');
  return items.map(item => ({
    id: item.objectId,
    objectId: item.objectId,
    regNumber: item.objectData.regNumber,
    name: item.objectData.name,
    email: item.objectData.email,
    phone: item.objectData.phone,
    timestamp: item.objectData.timestamp,
    approved: item.objectData.approved || false
  }));
}

// Creates a temporary password for the student and returns it with their contact details.
async function approvePasswordRequest(requestId) {
  return await appApproveReset(requestId);
}

async function deletePasswordRequest(requestId) {
  await trickleDeleteObject('password_request', requestId);
}
