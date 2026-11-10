// readBy is a comma separated list of registration numbers. Newer entries look like "reg@timestamp".
function hasReadMessage(readBy, userId) {
  return String(readBy || '').split(',').some(e => e && e.split('@')[0] === userId);
}
function readByIds(readBy) {
  return String(readBy || '').split(',').filter(Boolean).map(e => e.split('@')[0]);
}

async function sendChatMessage(userId, userName, userPic, content, type = 'text', replyTo = null, fileName = null) {
  if (!content || (typeof content === 'string' && content.trim() === '')) {
    throw new Error('Cannot send empty message');
  }

  const replyToData = replyTo ? {
    id: replyTo.id,
    userId: replyTo.userId,
    userName: replyTo.userName,
    content: replyTo.content,
    type: replyTo.type,
    fileName: replyTo.fileName || ''
  } : null;
  
  const messageData = {
    userId,
    userName,
    userPic: userPic || '',
    content: typeof content === 'string' ? content.trim() : content,
    type,
    fileName: fileName || '',
    replyTo: replyToData ? JSON.stringify(replyToData) : '',
    timestamp: Date.now(),
    deleted: false,
    readBy: userId,
    readers: [],
    isAdmin: !!(JSON.parse(localStorage.getItem('currentUser') || '{}').isAdmin)
  };
  
  const created = await trickleCreateObject('chat_message', messageData);
  if (window.chatRealtime) window.chatRealtime.notifyMessage();
  return created;
}

async function getAllChatMessages() {
  try {
    const result = await trickleListObjects('chat_message', 50, false);
    
    if (!result || !result.items) {
      return [];
    }
    
    const messages = result.items
      .filter(item => item && item.objectData && !item.objectData.deleted)
      .map(item => {
        let replyTo = null;
        try {
          if (item.objectData.replyTo && item.objectData.replyTo !== '') {
            replyTo = JSON.parse(item.objectData.replyTo);
          }
        } catch (e) {}
        
        return {
          id: item.objectId,
          userId: item.objectData.userId,
          userName: item.objectData.userName,
          userPic: item.objectData.userPic || '',
          content: item.objectData.content,
          type: item.objectData.type || 'text',
          fileName: item.objectData.fileName || '',
          replyTo: replyTo,
          timestamp: item.objectData.timestamp || Date.now(),
          readBy: item.objectData.readBy || '',
          readers: Array.isArray(item.objectData.readers) ? item.objectData.readers : [],
          isAdmin: !!item.objectData.isAdmin
        };
      })
      .sort((a, b) => a.timestamp - b.timestamp);
    
    return messages;
  } catch (error) {
    if (error.message && error.message.includes('NoPermission')) {
      console.log('No permission to check messages - user may need to sign in');
      return [];
    }
    console.error('Error getting chat messages:', error);
    return [];
  }
}

async function deleteChatMessage(messageId, deleteForEveryone) {
  const msg = await trickleGetObject('chat_message', messageId);
  if (msg) {
    if (deleteForEveryone) {
      await trickleUpdateObject('chat_message', messageId, { deleted: true });
      if (window.chatRealtime) window.chatRealtime.notifyMessage();
    } else {
      await trickleDeleteObject('chat_message', messageId);
    }
  }
}

// Marks a message as read by this user and remembers when (and who) so "Viewers" can show it.
async function markMessageAsRead(messageId, userId, reader) {
  try {
    for (let attempt = 0; attempt < 2; attempt++) {
      const msg = await trickleGetObject('chat_message', messageId);
      if (!msg) return;
      const readBy = msg.objectData.readBy || '';
      if (hasReadMessage(readBy, userId)) return;
      const now = Date.now();
      const readers = (Array.isArray(msg.objectData.readers) ? msg.objectData.readers : []).filter(r => r.id !== userId);
      readers.push({ id: userId, name: (reader && reader.name) || '', pic: (reader && reader.pic) || '', at: now });
      const nextReadBy = readBy ? `${readBy},${userId}@${now}` : `${userId}@${now}`;
      try {
        await trickleUpdateObject('chat_message', messageId, { readBy: nextReadBy, readers });
      } catch (e) {
        // database not upgraded yet (07_chat_features.sql): still record the read
        await trickleUpdateObject('chat_message', messageId, { readBy: nextReadBy });
      }
      // two people may read at the same moment: check ours was kept, otherwise try once more
      const check = await trickleGetObject('chat_message', messageId);
      if (check && hasReadMessage(check.objectData.readBy, userId)) return;
    }
  } catch (error) {}
}

async function setTypingStatus(userId, isTyping) {
  const key = `chat_typing_${userId}`;
  if (isTyping) {
    localStorage.setItem(key, Date.now().toString());
  } else {
    localStorage.removeItem(key);
  }
  if (window.chatRealtime) window.chatRealtime.sendTyping(userId, isTyping);
}

function getTypingUsers(currentUserId) {
  const users = [];
  const now = Date.now();
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('chat_typing_')) {
      const userId = key.replace('chat_typing_', '');
      if (userId !== currentUserId) {
        const timestamp = parseInt(localStorage.getItem(key) || '0');
        if (now - timestamp < 5000) {
          users.push(userId);
        }
      }
    }
  }
  if (window.chatRealtime) {
    window.chatRealtime.typingUsers(currentUserId).forEach(id => { if (!users.includes(id)) users.push(id); });
  }
  return users;
}