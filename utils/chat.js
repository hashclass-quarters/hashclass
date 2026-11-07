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
    readBy: userId
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
          readBy: item.objectData.readBy || ''
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

async function markMessageAsRead(messageId, userId) {
  try {
    const msg = await trickleGetObject('chat_message', messageId);
    if (msg) {
      const readBy = msg.objectData.readBy || '';
      if (!readBy.split(',').includes(userId)) {
        await trickleUpdateObject('chat_message', messageId, {
          readBy: readBy ? `${readBy},${userId}` : userId
        });
      }
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