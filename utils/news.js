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

// likes / views / comments are changed on the server in one locked step (app_news_action),
// so two students acting at the same moment never overwrite each other.
function newsAction(newsId, action, extra) {
  return window.HC.rpc('app_news_action', Object.assign({ token: window.HC.getToken(), id: newsId, action: action }, extra || {}));
}

async function toggleNewsLike(newsId) {
  await newsAction(newsId, 'like');
}

async function addNewsComment(newsId, userId, userName, userProfilePic, text) {
  await newsAction(newsId, 'comment', { text: text });
}

async function addCommentReply(newsId, commentId, userId, userName, userProfilePic, text) {
  await newsAction(newsId, 'reply', { commentId: commentId, text: text });
}

async function clearCommentNotification(newsId, commentId) {
  await newsAction(newsId, 'clear_notification', { commentId: commentId });
}

async function addNewsView(newsId) {
  await newsAction(newsId, 'view');
}

async function deleteNews(newsId) {
  await trickleDeleteObject('news_post', newsId);
}

async function deleteNewsComment(newsId, commentId) {
  await newsAction(newsId, 'delete_comment', { commentId: commentId });
}
