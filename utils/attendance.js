async function markAttendance(date, userId, isPresent) {
  const dateKey = formatDateKey(date);
  const result = await trickleListObjects('attendance_record', 1, true, undefined, { filter: { date: dateKey, userId: userId } });
  const existing = result.items[0];
  
  if (existing) {
    await trickleUpdateObject('attendance_record', existing.objectId, {
      date: dateKey,
      userId: userId,
      isPresent: isPresent,
      timestamp: Date.now()
    });
  } else {
    await trickleCreateObject('attendance_record', {
      date: dateKey,
      userId: userId,
      isPresent: isPresent,
      timestamp: Date.now()
    });
  }
}

async function recordAttendance(regNumber, name, profilePic, date, isPresent) {
  try {
    const dateKey = formatDateKey(date);
    const result = await trickleListObjects('attendance_record', 1, true, undefined, { filter: { date: dateKey, userId: regNumber } });
    const existing = result.items[0];
    
    if (existing) {
      await trickleUpdateObject('attendance_record', existing.objectId, {
        date: dateKey,
        userId: regNumber,
        userName: name,
        userPic: profilePic,
        isPresent: isPresent,
        timestamp: Date.now()
      });
    } else {
      await trickleCreateObject('attendance_record', {
        date: dateKey,
        userId: regNumber,
        userName: name,
        userPic: profilePic,
        isPresent: isPresent,
        timestamp: Date.now()
      });
    }
    return true;
  } catch (error) {
    console.error('Record attendance error:', error);
    return false;
  }
}

async function getAttendanceForDate(date) {
  const dateKey = formatDateKey(date);
  const items = await trickleListAll('attendance_record', { filter: { date: dateKey } });
  return items
    .map(item => ({
      userId: item.objectData.userId,
      isPresent: item.objectData.isPresent,
      timestamp: item.objectData.timestamp
    }));
}

async function getUserAttendance(userId) {
  const items = await trickleListAll('attendance_record', { filter: { userId: userId } });
  return items
    .map(item => ({
      date: item.objectData.date,
      isPresent: item.objectData.isPresent,
      timestamp: item.objectData.timestamp
    }));
}

function formatDateKey(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getTanzaniaDate() {
  const now = new Date();
  const tanzaniaTime = new Date(now.toLocaleString('en-US', { timeZone: 'Africa/Dar_es_Salaam' }));
  return tanzaniaTime;
}