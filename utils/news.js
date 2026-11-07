async function getAllNews() {
  const result = await trickleListObjects('news_post', 1000, true);
  return result.items.map(item => ({
    id: item.objectId,
    objectId: item.objectId,
    image: item.objectData.image,
    description: item.objectData.description,
    timestamp: item.objectData.timestamp,
    likes: item.objectData.likes ? item.objectData.likes.split(',').filter(x => x) : [],
    comments: item.objectData.comments ? JSON.parse(item.objectData.comments) : [],
    views: item.objectData.views ? item.objectData.views.split(',').filter(x => x) : []
  }));
}

async function addNews(newsData) {
  await trickleCreateObject('news_post', {
    image: newsData.image,
    description: newsData.description,
    timestamp: Date.now(),
    likes: '',
    comments: '[]',
    views: ''
  });
}

async function toggleNewsLike(newsId, userId) {
  const post = await trickleGetObject('news_post', newsId);
  if (post) {
    let likes = post.objectData.likes ? post.objectData.likes.split(',').filter(x => x) : [];
    const idx = likes.indexOf(userId);
    if (idx > -1) likes.splice(idx, 1);
    else likes.push(userId);
    await trickleUpdateObject('news_post', newsId, {
      likes: likes.join(','),
      comments: post.objectData.comments || '[]',
      views: post.objectData.views || ''
    });
  }
}

async function addNewsComment(newsId, userId, userName, userProfilePic, text) {
  const post = await trickleGetObject('news_post', newsId);
  if (post) {
    let comments = post.objectData.comments ? JSON.parse(post.objectData.comments) : [];
    const commentId = Date.now();
    comments.push({ 
      id: commentId,
      userId, 
      userName,
      userProfilePic: userProfilePic || '',
      text, 
      timestamp: Date.now(),
      replies: [],
      notifiedUsers: []
    });
    await trickleUpdateObject('news_post', newsId, {
      likes: post.objectData.likes || '',
      comments: JSON.stringify(comments),
      views: post.objectData.views || ''
    });
  }
}

async function addCommentReply(newsId, commentId, userId, userName, userProfilePic, text) {
  const post = await trickleGetObject('news_post', newsId);
  if (post) {
    let comments = post.objectData.comments ? JSON.parse(post.objectData.comments) : [];
    const comment = comments.find(c => c.id === commentId);
    if (comment) {
      comment.replies = comment.replies || [];
      comment.replies.push({
        userId,
        userName,
        userProfilePic: userProfilePic || '',
        text,
        timestamp: Date.now()
      });
      
      comment.notifiedUsers = comment.notifiedUsers || [];
      if (!comment.notifiedUsers.includes(comment.userId)) {
        comment.notifiedUsers.push(comment.userId);
      }
      comment.replies.forEach(reply => {
        if (!comment.notifiedUsers.includes(reply.userId) && reply.userId !== userId) {
          comment.notifiedUsers.push(reply.userId);
        }
      });
      
      await trickleUpdateObject('news_post', newsId, {
        likes: post.objectData.likes || '',
        comments: JSON.stringify(comments),
        views: post.objectData.views || ''
      });
    }
  }
}

async function clearCommentNotification(newsId, commentId, userId) {
  const post = await trickleGetObject('news_post', newsId);
  if (post) {
    let comments = post.objectData.comments ? JSON.parse(post.objectData.comments) : [];
    const comment = comments.find(c => c.id === commentId);
    if (comment && comment.notifiedUsers) {
      comment.notifiedUsers = comment.notifiedUsers.filter(id => id !== userId);
      await trickleUpdateObject('news_post', newsId, {
        likes: post.objectData.likes || '',
        comments: JSON.stringify(comments),
        views: post.objectData.views || ''
      });
    }
  }
}

async function addNewsView(newsId, userId) {
  const post = await trickleGetObject('news_post', newsId);
  if (post) {
    let views = post.objectData.views ? post.objectData.views.split(',').filter(x => x) : [];
    if (!views.includes(userId)) {
      views.push(userId);
      await trickleUpdateObject('news_post', newsId, {
        likes: post.objectData.likes || '',
        comments: post.objectData.comments || '[]',
        views: views.join(',')
      });
    }
  }
}

async function deleteNews(newsId) {
  await trickleDeleteObject('news_post', newsId);
}

async function deleteNewsComment(newsId, commentId) {
  const post = await trickleGetObject('news_post', newsId);
  if (post && post.objectData.comments) {
    let comments = JSON.parse(post.objectData.comments);
    comments = comments.filter(c => c.id !== commentId);
    await trickleUpdateObject('news_post', newsId, {
      likes: post.objectData.likes || '',
      comments: JSON.stringify(comments),
      views: post.objectData.views || ''
    });
  }
}
