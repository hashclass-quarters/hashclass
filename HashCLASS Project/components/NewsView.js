function NewsView() {
  try {
    const [news, setNews] = React.useState([]);
    const [newPost, setNewPost] = React.useState({ image: '', description: '' });
    const [expandedStats, setExpandedStats] = React.useState(null);
    const [expandedReplies, setExpandedReplies] = React.useState({});
    const [allUsers, setAllUsers] = React.useState([]);

    React.useEffect(() => {
      loadNews();
      loadUsers();
    }, []);

    const loadNews = async () => {
      const posts = await getAllNews();
      setNews(posts.sort((a, b) => b.timestamp - a.timestamp));
    };

    const loadUsers = async () => {
      const users = await getAllRegisteredUsers();
      setAllUsers(users);
    };

    const handlePost = async () => {
      if (!canPostNews(JSON.parse(localStorage.getItem('currentUser')))) {
        showUnauthorizedAlert();
        return;
      }
      if (newPost.image && newPost.description) {
        await addNews(newPost);
        setNewPost({ image: '', description: '' });
        loadNews();
      }
    };

    const handleDelete = async (objectId) => {
      if (!canPostNews(JSON.parse(localStorage.getItem('currentUser')))) {
        showUnauthorizedAlert();
        return;
      }
      if (confirm('Delete this post?')) {
        await deleteNews(objectId);
        loadNews();
      }
    };

    const getUserName = (userId) => {
      const user = allUsers.find(u => u.regNumber === userId);
      return user ? user.name : 'Unknown';
    };

    const getUserProfilePic = (userId) => {
      const user = allUsers.find(u => u.regNumber === userId);
      return user?.profilePic || 'https://via.placeholder.com/40';
    };

    return (
      <div>
        <h2 className="text-2xl font-bold mb-6">News Management</h2>
        {canPostNews(JSON.parse(localStorage.getItem('currentUser'))) && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h3 className="text-lg font-bold mb-4">Create New Post</h3>
          <div className="relative mb-3">
            <input value={newPost.image} onChange={e => setNewPost({...newPost, image: e.target.value})} placeholder="Image URL" className="w-full px-3 py-2 border rounded-lg pr-12" />
            <label className="absolute right-2 top-2 cursor-pointer bg-gray-100 p-2 rounded hover:bg-gray-200">
              <div className="icon-upload text-lg text-gray-600"></div>
              <input type="file" accept="image/*" onChange={e => {
                const file = e.target.files[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onloadend = () => setNewPost({...newPost, image: reader.result});
                  reader.readAsDataURL(file);
                }
              }} className="hidden" />
            </label>
          </div>
          <textarea value={newPost.description} onChange={e => setNewPost({...newPost, description: e.target.value})} placeholder="Description" className="w-full px-3 py-2 border rounded-lg mb-3 h-24" />
          <button onClick={handlePost} className="px-6 py-2 bg-[var(--primary-color)] text-white rounded-lg">POST</button>
          </div>
        )}
        <div className="space-y-4">
          {news.map(post => (
            <div key={post.objectId} className="bg-white rounded-xl shadow-md overflow-hidden">
              <img src={post.image} className="w-full aspect-video object-cover" />
              <div className="p-4">
                <p className="text-sm mb-2">{post.description}</p>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span>{post.likes?.length || 0} likes</span>
                  <span>{post.comments?.length || 0} comments</span>
                  <span>{post.views?.length || 0} views</span>
                </div>
                <div className="flex gap-2 mt-3">
                  <button onClick={() => setExpandedStats(expandedStats === post.objectId ? null : post.objectId)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">Statistics</button>
                  {canPostNews(JSON.parse(localStorage.getItem('currentUser'))) && (
                    <button onClick={() => handleDelete(post.objectId)} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm">Delete</button>
                  )}
                </div>
                {expandedStats === post.objectId && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg text-sm">
                    <div className="mb-3">
                      <strong>Liked by:</strong> {post.likes?.map(getUserName).join(', ') || 'None'}
                    </div>
                    <div className="mb-3">
                      <strong>Comments ({post.comments?.length || 0}):</strong>
                      {[...(post.comments || [])].reverse().map((c, i) => {
                        const names = c.userName.split(' ');
                        const displayName = names.length >= 2 ? `${names[0]} ${names[names.length - 1]}` : c.userName;
                        const replyKey = `${post.objectId}-${c.id}`;
                        const isRepliesExpanded = expandedReplies[replyKey];
                        return (
                          <div key={`admin-comment-${i}-${c.id}`} className="ml-4 mt-2 p-2 bg-white rounded border">
                            <div className="flex items-start gap-2">
                              <img src={getUserProfilePic(c.userId)} alt="Profile" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <div 
                                  className="font-semibold text-[var(--primary-color)] cursor-pointer hover:underline"
                                  onClick={() => setExpandedReplies(prev => ({...prev, [replyKey]: !prev[replyKey]}))}
                                >
                                  {displayName}
                                  {c.replies && c.replies.length > 0 && (
                                    <span className="ml-2 text-xs text-gray-500">({c.replies.length} replies)</span>
                                  )}
                                </div>
                                <div className="mt-1">{c.text}</div>
                                <div className="text-xs text-gray-500 mt-1">
                                  {new Date(c.timestamp).toLocaleString()}
                                </div>
                                {c.replies && c.replies.length > 0 && isRepliesExpanded && (
                                  <div className="mt-2 ml-4 space-y-2">
                                    <strong className="text-xs">Replies ({c.replies.length}):</strong>
                                    {c.replies.map((reply, idx) => {
                                      const replyNames = reply.userName.split(' ');
                                      const replyDisplayName = replyNames.length >= 2 ? `${replyNames[0]} ${replyNames[replyNames.length - 1]}` : reply.userName;
                                      return (
                                        <div key={`reply-${idx}-${reply.timestamp}`} className="p-2 bg-gray-50 rounded border-l-2 border-[var(--primary-color)] flex items-start gap-2">
                                          <img src={getUserProfilePic(reply.userId)} alt="Profile" className="w-6 h-6 rounded-full object-cover flex-shrink-0" />
                                          <div className="flex-1 min-w-0">
                                            <div className="font-semibold text-xs text-[var(--primary-color)]">{replyDisplayName}</div>
                                            <div className="text-xs mt-1">{reply.text}</div>
                                            <div className="text-xs text-gray-500 mt-1">
                                              {new Date(reply.timestamp).toLocaleString()}
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                              <button 
                                onClick={async () => {
                                  if (confirm('Delete this comment and all its replies?')) {
                                    await deleteNewsComment(post.objectId, c.id);
                                    loadNews();
                                  }
                                }}
                                className="text-red-600 hover:text-red-800 flex-shrink-0"
                              >
                                <div className="icon-trash-2 text-base"></div>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                      {(!post.comments || post.comments.length === 0) && (
                        <div className="ml-4 mt-2 text-gray-500">No comments yet</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  } catch (error) {
    console.error('NewsView error:', error);
    return null;
  }
}