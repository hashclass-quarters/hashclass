async function addValidUser(userData) {
  await trickleCreateObject('valid_user', {
    regNumber: userData.regNumber,
    name: userData.name,
    course: userData.course,
    year: userData.year
  });
}

// NOTE: these take the database object id (not the registration number)
async function deleteValidUser(objectId) {
  await trickleDeleteObject('valid_user', objectId);
}

async function deleteRegisteredUser(objectId) {
  await trickleDeleteObject('registered_user', objectId);
}

async function markUserAsPaid(objectId) {
  await trickleUpdateObject('registered_user', objectId, { paid: true });
}

async function markUserAsUnpaid(objectId) {
  await trickleUpdateObject('registered_user', objectId, { paid: false });
}
