function ChatMessage({ message, currentUser, onReply, onDelete, onReplyClick }) {
  try {
    const [touchStart, setTouchStart] = React.useState(0);
    const [touchEnd, setTouchEnd] = React.useState(0);
    const [swipeOffset, setSwipeOffset] = React.useState(0);
    const [longPressTimer, setLongPressTimer] = React.useState(null);
    const [showDeleteMenu, setShowDeleteMenu] = React.useState(false);
    
    const isOwnMessage = message.userId === currentUser.regNumber;
    const names = message.userName.split(' ');
    const displayName = names.length >= 2 ? `${names[0]} ${names[names.length - 1]}` : message.userName;

    const handleTouchStart = (e) => {
      const touch = e.targetTouches[0].clientX;
      setTouchStart(touch);
      const timer = setTimeout(() => {
        setShowDeleteMenu(true);
      }, 500);
      setLongPressTimer(timer);
    };

    const handleTouchMove = (e) => {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
        setLongPressTimer(null);
      }
      const currentTouch = e.targetTouches[0].clientX;
      const diff = currentTouch - touchStart;
      if (diff > 0 && diff < 100) {
        setSwipeOffset(diff);
      }
    };

    const handleTouchEnd = () => {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
        setLongPressTimer(null);
      }
      if (swipeOffset > 50) {
        onReply(message);
      }
      setSwipeOffset(0);
      setTouchStart(0);
    };

    const isOnlyEmoji = (text) => {
      const emojiRegex = /^(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)$/u;
      return emojiRegex.test(text.trim());
    };

    const renderContent = () => {
      if (message.type === 'image') {
        return <img src={message.content} className="max-w-[200px] max-h-[200px] rounded-lg object-cover cursor-pointer" alt="Shared" onClick={() => window.open(message.content, '_blank')} />;
      }
      if (message.type === 'video') {
        return <video src={message.content} controls className="max-w-[200px] max-h-[200px] rounded-lg" />;
      }
      if (message.type === 'file') {
        return (
          <a href={message.content} download={message.fileName} className="flex items-center gap-2 p-2 bg-white bg-opacity-20 rounded">
            <div className="icon-file text-lg"></div>
            <div>
              <p className="text-xs font-semibold">{message.fileName}</p>
              <p className="text-xs opacity-75">Tap to download</p>
            </div>
          </a>
        );
      }
      
      if (message.type === 'text' && isOnlyEmoji(message.content)) {
        return null;
      }
      
      return <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>;
    };

    const isSingleEmoji = message.type === 'text' && isOnlyEmoji(message.content);

    if (isSingleEmoji) {
      return (
        <>
          <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} ${message.isOptimistic ? 'opacity-60' : ''}`} data-message-id={message.id}>
            <div 
              className="flex flex-col items-center gap-1 transition-transform duration-200"
              style={{ transform: `translateX(${swipeOffset}px)` }}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <img src={message.userPic || currentUser.profilePic} alt="" className="w-8 h-8 rounded-full object-cover" />
              <div className="text-6xl">{message.content}</div>
            </div>
          </div>
          {showDeleteMenu && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowDeleteMenu(false)}>
              <div className="bg-white rounded-xl p-4 w-64 mx-4" onClick={e => e.stopPropagation()}>
                <button onClick={() => { onDelete(message.id, false); setShowDeleteMenu(false); }} className="w-full py-3 text-left border-b">Delete for me</button>
                {isOwnMessage && (
                  <button onClick={() => { onDelete(message.id, true); setShowDeleteMenu(false); }} className="w-full py-3 text-left text-red-600">Delete for everyone</button>
                )}
                <button onClick={() => setShowDeleteMenu(false)} className="w-full py-3 text-left text-gray-500">Cancel</button>
              </div>
            </div>
          )}
        </>
      );
    }

    const isCEO = message.userName === 'CHIEF EXECUTIVE OFFICER';
    const ceoStyle = isCEO ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-gray-900 border-2 border-yellow-500 shadow-lg' : '';

    return (
      <>
        <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} ${message.isOptimistic ? 'opacity-60' : ''}`} data-message-id={message.id}>
          <div 
            className={`max-w-[75%] ${isOwnMessage ? (isCEO ? ceoStyle : 'bg-[var(--primary-color)] text-white') : 'bg-white text-gray-800'} rounded-lg p-2 shadow-sm transition-transform duration-200`}
            style={{ transform: `translateX(${swipeOffset}px)` }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {!isOwnMessage && (
              <div className="flex items-center gap-2 mb-1">
                <img src={message.userPic || 'https://via.placeholder.com/40'} alt={displayName} className="w-8 h-8 rounded-full flex-shrink-0 object-cover" />
                <p className="text-xs font-bold text-[var(--primary-color)]">{displayName}</p>
              </div>
            )}
            {isOwnMessage && (
              <div className="flex items-center gap-2 mb-1">
                <img src={message.userPic || currentUser.profilePic} alt="You" className="w-8 h-8 rounded-full flex-shrink-0 object-cover" />
                {isCEO ? (
                  <>
                    <div className="icon-crown text-sm text-yellow-900"></div>
                    <p className="text-xs font-bold text-yellow-900">CEO</p>
                  </>
                ) : (
                  <p className="text-xs font-bold text-white opacity-90">You</p>
                )}
              </div>
            )}
      {message.replyTo && (
        <div 
          onClick={() => onReplyClick && onReplyClick(message.replyTo.id)}
          className={`mb-2 p-2 rounded-lg text-xs cursor-pointer border-l-4 ${isOwnMessage ? 'border-white' : 'border-[var(--primary-color)]'}`}
          style={{ backgroundColor: isOwnMessage ? 'rgba(255, 255, 255, 0.3)' : 'rgba(139, 92, 246, 0.25)' }}
        >
                <p className="font-semibold text-xs opacity-75">{message.replyTo.userName}</p>
                {message.replyTo.type === 'image' ? (
                  <div className="flex items-center gap-1">
                    <div className="icon-image text-xs"></div>
                    <span className="text-xs opacity-75">Photo</span>
                  </div>
                ) : message.replyTo.type === 'video' ? (
                  <div className="flex items-center gap-1">
                    <div className="icon-video text-xs"></div>
                    <span className="text-xs opacity-75">Video</span>
                  </div>
                ) : message.replyTo.type === 'file' ? (
                  <div className="flex items-center gap-1">
                    <div className="icon-file text-xs"></div>
                    <span className="text-xs opacity-75">{message.replyTo.fileName}</span>
                  </div>
                ) : (
                  <p className="text-xs opacity-75 truncate">{message.replyTo.content.substring(0, 40)}</p>
                )}
              </div>
            )}
            <div className="flex items-end gap-2">
              <div className="flex-1">
                {renderContent()}
              </div>
              <div className={`flex items-center gap-1 flex-shrink-0 self-end text-xs ${isOwnMessage ? 'opacity-75' : 'text-gray-500'}`}>
                <span className="text-xs whitespace-nowrap">{new Date(message.timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</span>
              </div>
            </div>
          </div>
        </div>
        {showDeleteMenu && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowDeleteMenu(false)}>
            <div className="bg-white rounded-xl p-4 w-64 mx-4" onClick={e => e.stopPropagation()}>
              <button onClick={() => { onDelete(message.id, false); setShowDeleteMenu(false); }} className="w-full py-3 text-left border-b">Delete for me</button>
              {isOwnMessage && (
                <button onClick={() => { onDelete(message.id, true); setShowDeleteMenu(false); }} className="w-full py-3 text-left text-red-600">Delete for everyone</button>
              )}
              <button onClick={() => setShowDeleteMenu(false)} className="w-full py-3 text-left text-gray-500">Cancel</button>
            </div>
          </div>
        )}
      </>
    );
  } catch (error) {
    console.error('ChatMessage error:', error);
    return null;
  }
}