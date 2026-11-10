function NewsPost({ post: initialPost, user, onRefresh }) {
  try {
    const [post, setPost] = React.useState(initialPost);
    const [showComments, setShowComments] = React.useState(false);
    const [comment, setComment] = React.useState('');
    const [replyText, setReplyText] = React.useState('');
    const [replyingTo, setReplyingTo] = React.useState(null);
    const [expandedReplies, setExpandedReplies] = React.useState({});

    React.useEffect(() => {
      setPost(initialPost);
    }, [initialPost]);

    const handleLike = async (e) => {
      e.stopPropagation();
      
      const currentLikes = post.likes || [];
      const isCurrentlyLiked = currentLikes.includes(user.regNumber);
      let updatedLikes;
      
      if (isCurrentlyLiked) {
        updatedLikes = currentLikes.filter(id => id !== user.regNumber);
      } else {
        updatedLikes = [...currentLikes, user.regNumber];
      }
      
      setPost({ ...post, likes: updatedLikes });
      
      toggleNewsLike(post.objectId, user.regNumber).then(() => {
        onRefresh();
      }).catch(error => {
        console.error('Like error:', error);
        setPost({ ...post, likes: currentLikes });
      });
    };

    const handleComment = async (e) => {
      e.stopPropagation();
      if (comment.trim()) {
        const newComment = {
          id: Date.now(),
          userId: user.regNumber,
          userName: user.name,
          userProfilePic: user.profilePic || 'https://via.placeholder.com/40',
          text: comment.trim(),
          timestamp: Date.now(),
          replies: [],
          notifiedUsers: []
        };
        
        const updatedComments = [...(post.comments || []), newComment];
        setPost({ ...post, comments: updatedComments });
        setComment('');
        
        addNewsComment(post.objectId, user.regNumber, user.name, user.profilePic, comment.trim()).then(() => {
          onRefresh();
        }).catch(error => {
          console.error('Comment error:', error);
          const rollbackComments = (post.comments || []).filter(c => c.id !== newComment.id);
          setPost({ ...post, comments: rollbackComments });
        });
      }
    };

    const handleReply = async (commentId) => {
      if (replyText.trim()) {
        const newReply = {
          userId: user.regNumber,
          userName: user.name,
          userProfilePic: user.profilePic || 'https://via.placeholder.com/40',
          text: replyText.trim(),
          timestamp: Date.now()
        };
        
        const updatedComments = (post.comments || []).map(c => {
          if (c.id === commentId) {
            return {
              ...c,
              replies: [...(c.replies || []), newReply]
            };
          }
          return c;
        });
        
        setPost({ ...post, comments: updatedComments });
        setReplyText('');
        setReplyingTo(null);
        
        addCommentReply(post.objectId, commentId, user.regNumber, user.name, user.profilePic, replyText.trim()).then(() => {
          onRefresh();
        }).catch(error => {
          console.error('Reply error:', error);
          const rollbackComments = (post.comments || []).map(c => {
            if (c.id === commentId) {
              return {
                ...c,
                replies: (c.replies || []).filter(r => r.timestamp !== newReply.timestamp)
              };
            }
            return c;
          });
          setPost({ ...post, comments: rollbackComments });
        });
      }
    };

    const isLiked = (post.likes || []).includes(user.regNumber);
    const sortedComments = [...(post.comments || [])].reverse();

    return (
      <div className="bg-white rounded-xl shadow-md overflow-hidden mb-4">
        <img src={post.image} className="w-full aspect-video object-cover" onClick={() => setShowComments(!showComments)} />
        <div className="p-4">
          <p className="text-sm mb-2">{post.description}</p>
          <div className="flex items-center gap-6 mb-3">
            <button onClick={handleLike} className="flex items-center gap-2">
              {isLiked ? (
                <span className="text-xl">❤️</span>
              ) : (
                <div className="icon-heart text-xl text-gray-600"></div>
              )}
              <span className={`text-sm font-semibold ${isLiked ? 'text-red-500' : 'text-gray-600'}`}>{(post.likes || []).length}</span>
            </button>
            <button onClick={() => setShowComments(!showComments)} className="flex items-center gap-2 text-gray-600">
              <div className="icon-message-circle text-xl"></div>
              <span className="text-sm">{(post.comments || []).length}</span>
            </button>
            <a href={post.image} download className="flex items-center gap-2 text-gray-600 hover:text-[var(--primary-color)]">
              <div className="icon-download text-xl"></div>
            </a>
            <span className="ml-auto text-xs text-gray-500 whitespace-nowrap">{formatTimestamp(post.timestamp)}</span>
          </div>
          {showComments && (
            <div className="border-t pt-3">
              <div className="flex gap-2 mb-3">
                <input value={comment} onChange={e => setComment(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleComment(e)} placeholder="Add a comment..." className="flex-1 px-3 py-2 border rounded-lg text-sm" />
                <button onClick={handleComment} className="px-4 py-2 bg-[var(--primary-color)] text-white rounded-lg text-sm">COMMENT</button>
              </div>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {sortedComments.map(c => {
                  const names = c.userName.split(' ');
                  const displayName = names.length >= 2 ? `${names[0]} ${names[names.length - 1]}` : c.userName;
                  const profilePic = c.userProfilePic || user.profilePic || 'https://via.placeholder.com/40';
                  return (
                    <div key={c.id} className="bg-gray-50 rounded-lg p-3">
                      <div 
                        className="flex items-start gap-2 cursor-pointer"
                        onClick={() => setExpandedReplies(prev => ({...prev, [c.id]: !prev[c.id]}))}
                      >
                        <img src={profilePic} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold text-sm text-[var(--primary-color)]">{displayName}</span>
                                <span className="text-sm text-gray-700">{c.text}</span>
                              </div>
                              <p className="text-xs text-gray-500">{formatTimestamp(c.timestamp)}</p>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-gray-500 hover:text-[var(--primary-color)] flex-shrink-0">
                              <div className="icon-corner-down-right text-sm"></div>
                              <span>{c.replies?.length || 0}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      {expandedReplies[c.id] && (
                        <div className="mt-3 space-y-2 ml-10 border-l-2 border-gray-200 pl-3" onClick={e => e.stopPropagation()}>
                          {c.replies && c.replies.map((r, idx) => {
                            const rNames = r.userName.split(' ');
                            const rDisplayName = rNames.length >= 2 ? `${rNames[0]} ${rNames[rNames.length - 1]}` : r.userName;
                            const replyProfilePic = r.userProfilePic || user.profilePic || 'https://via.placeholder.com/32';
                            return (
                              <div key={idx} className="flex items-start gap-2">
                                <img src={replyProfilePic} className="w-6 h-6 rounded-full object-cover flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-semibold text-xs text-[var(--primary-color)]">{rDisplayName}</span>
                                    <span className="text-xs text-gray-700">{r.text}</span>
                                  </div>
                                  <p className="text-xs text-gray-500">{formatTimestamp(r.timestamp)}</p>
                                </div>
                              </div>
                            );
                          })}
                          <div className="flex gap-2 mt-2">
                            <input 
                              value={replyingTo === c.id ? replyText : ''} 
                              onChange={e => { setReplyingTo(c.id); setReplyText(e.target.value); }}
                              onKeyPress={e => e.key === 'Enter' && handleReply(c.id)} 
                              placeholder="Write a reply..." 
                              className="flex-1 px-3 py-2 border rounded-lg text-sm" 
                            />
                            <button onClick={() => handleReply(c.id)} className="px-4 py-2 bg-[var(--primary-color)] text-white rounded-lg text-sm">REPLY</button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  } catch (error) {
    console.error('NewsPost error:', error);
    return null;
  }
}

function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const postDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  
  const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  
  if (postDate.getTime() === today.getTime()) {
    return `Today at ${timeStr}`;
  } else if (postDate.getTime() === yesterday.getTime()) {
    return `Yesterday at ${timeStr}`;
  } else {
    const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return `${dateStr} at ${timeStr}`;
  }
}
