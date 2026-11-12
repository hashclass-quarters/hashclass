function ChatMessage({ message, currentUser, onReply, onDelete, onReplyClick }) {
  try {
    const [touchStart, setTouchStart] = React.useState(0);
    const [touchEnd, setTouchEnd] = React.useState(0);
    const [swipeOffset, setSwipeOffset] = React.useState(0);
    const [longPressTimer, setLongPressTimer] = React.useState(null);
    const [showDeleteMenu, setShowDeleteMenu] = React.useState(false);
    const [showViewers, setShowViewers] = React.useState(false);
    
    const isOwnMessage = message.userId === currentUser.regNumber;
    const isAdminMsg = !!message.isAdmin || message.userName === 'CHIEF EXECUTIVE OFFICER';
    const names = (message.userName || '').split(' ');
    const displayName = isAdminMsg ? 'HashCLASS CEO' : (names.length >= 2 ? `${names[0]} ${names[names.length - 1]}` : message.userName);
    const senderPic = isAdminMsg ? 'assets/logo.png' : message.userPic;

    // people who have read this message (everyone except the sender), earliest first
    const viewers = (Array.isArray(message.readers) ? message.readers : [])
      .filter(r => r && r.id && r.id !== message.userId)
      .sort((a, b) => (a.at || 0) - (b.at || 0));
    const shortName = (n) => { const p = String(n || '').trim().split(/\s+/); return p.length >= 2 ? `${p[0]} ${p[p.length - 1]}` : (p[0] || 'Student'); };
    const readTime = (t) => {
      if (!t) return '';
      const d = new Date(t), now = new Date();
      const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
      return d.toDateString() === now.toDateString() ? time : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ', ' + time;
    };

    // the press-and-hold popup (shared by every kind of message)
    const renderMenu = () => (
      <>
        {showDeleteMenu && (
          <div className="fixed inset-0 flex items-center justify-center z-50 animate-fadeIn" style={{ background: 'rgba(8,16,70,.45)', WebkitBackdropFilter: 'blur(5px)', backdropFilter: 'blur(5px)' }} onClick={() => setShowDeleteMenu(false)}>
            <div className="w-64 mx-4 overflow-hidden" style={{ background: '#fff', borderRadius: 18, border: '2px solid #1230B5', boxShadow: '0 18px 50px rgba(10,26,122,.4)' }} onClick={e => e.stopPropagation()}>
              <div className="px-4 py-2.5 flex items-center gap-2" style={{ background: 'linear-gradient(90deg,#0A1A7A,#1230B5)' }}>
                <div className="icon-message-circle text-base text-white"></div>
                <p className="font-bold text-white" style={{ fontSize: 13 }}>Message options</p>
              </div>
              <div className="p-2.5 space-y-1.5">
                {(isOwnMessage || currentUser.isAdmin) && (
                  <button onClick={() => { setShowDeleteMenu(false); setShowViewers(true); }} className="w-full px-3 py-2.5 rounded-xl flex items-center gap-3 text-left font-semibold" style={{ fontSize: 13, background: '#EAF0FF', color: '#1230B5' }}>
                    <span className="w-7 h-7 rounded-full flex items-center justify-center text-white" style={{ background: '#1230B5' }}><span className="icon-eye text-sm"></span></span> Viewers
                  </button>
                )}
                <button onClick={() => { onDelete(message.id, false); setShowDeleteMenu(false); }} className="w-full px-3 py-2.5 rounded-xl flex items-center gap-3 text-left font-semibold" style={{ fontSize: 13, background: '#FFF6DB', color: '#8A5A00' }}>
                  <span className="w-7 h-7 rounded-full flex items-center justify-center text-white" style={{ background: '#F5B400' }}><span className="icon-trash-2 text-sm"></span></span> Delete for me
                </button>
                {isOwnMessage && (
                  <button onClick={() => { onDelete(message.id, true); setShowDeleteMenu(false); }} className="w-full px-3 py-2.5 rounded-xl flex items-center gap-3 text-left font-semibold" style={{ fontSize: 13, background: '#FFE9E9', color: '#C62828' }}>
                    <span className="w-7 h-7 rounded-full flex items-center justify-center text-white" style={{ background: '#E53935' }}><span className="icon-trash text-sm"></span></span> Delete for everyone
                  </button>
                )}
                <button onClick={() => setShowDeleteMenu(false)} className="w-full py-2 rounded-xl text-center font-semibold text-gray-500" style={{ fontSize: 13, background: '#F3F4F8' }}>Cancel</button>
              </div>
            </div>
          </div>
        )}
        {showViewers && (
          <div className="fixed inset-0 flex items-center justify-center z-50 animate-fadeIn" style={{ background: 'rgba(8,16,70,.45)', WebkitBackdropFilter: 'blur(5px)', backdropFilter: 'blur(5px)' }} onClick={() => setShowViewers(false)}>
            <div className="bg-white p-4 w-80 max-w-[92vw] mx-4" style={{ borderRadius: 18, border: '2px solid #1230B5', boxShadow: '0 18px 50px rgba(10,26,122,.4)' }} onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-3 pb-2" style={{ borderBottom: '2px solid #EAF0FF' }}>
                <h3 className="font-bold" style={{ color: '#1230B5' }}>Viewers{viewers.length > 0 ? ` (${viewers.length})` : ''}</h3>
                <button onClick={() => setShowViewers(false)} aria-label="Close" className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100">
                  <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/></svg>
                </button>
              </div>
              {viewers.length === 0 ? (
                <p className="text-sm text-gray-500 py-4 text-center">No one has viewed this message yet</p>
              ) : (
                <div className="max-h-72 overflow-y-auto space-y-2">
                  {viewers.map(v => (
                    <div key={v.id} className="flex items-center gap-2 whitespace-nowrap">
                      <img src={v.pic || 'https://via.placeholder.com/40'} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0 bg-gray-100" />
                      <span className="flex-1 min-w-0 truncate text-sm font-semibold">{shortName(v.name)}</span>
                      <span className="text-xs text-gray-500 flex-shrink-0">{readTime(v.at)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </>
    );

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
      
      return <p className="leading-snug whitespace-pre-wrap break-words" style={{ fontSize: '12px' }}>{message.content}</p>;
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
              <img src={senderPic || currentUser.profilePic} alt="" className="w-8 h-8 rounded-full object-cover" />
              <div className="text-6xl">{message.content}</div>
            </div>
          </div>
          {renderMenu()}
        </>
      );
    }

    const isCEO = isAdminMsg;
    const ceoStyle = 'text-[#0A1A7A]';
    const ceoCss = { background: 'linear-gradient(180deg,#FFFFFF 0%,#EAF0FF 100%)', border: '2.5px solid #1230B5', boxShadow: '0 6px 18px rgba(18,48,181,.35)', borderRadius: '16px 16px 16px 4px', overflow: 'hidden' };

    return (
      <>
        <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} ${message.isOptimistic ? 'opacity-60' : ''}`} data-message-id={message.id}>
          <div 
            className={`max-w-[88%] ${isCEO ? ceoStyle : (isOwnMessage ? 'bg-[var(--primary-color)] text-white' : 'bg-white text-gray-800')} rounded-lg p-2 shadow-sm transition-transform duration-200`}
            style={{ transform: `translateX(${swipeOffset}px)`, ...(isCEO ? ceoCss : null) }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {isCEO ? (
              <div className="flex items-center gap-2 px-2 py-1.5 mb-1.5" style={{ background: 'linear-gradient(90deg,#0A1A7A,#1230B5)', margin: '-8px -8px 6px -8px' }}>
                <img src="assets/logo.png" alt="HashCLASS" className="w-8 h-8 rounded-full flex-shrink-0 object-contain bg-white" style={{ boxShadow: '0 0 0 2px #fff' }} />
                <p className="font-extrabold text-white tracking-wide flex items-center gap-1.5" style={{ fontSize: '10.5px' }}>HashCLASS CEO
                  <svg width="18" height="18" viewBox="0 0 18 18" style={{ display: 'block', flexShrink: 0 }} aria-label="Verified"><circle cx="9" cy="9" r="9" fill="#fff"/><path d="M5 9.3L7.8 12L13 6.3" fill="none" stroke="#1230B5" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </p>
              </div>
            ) : !isOwnMessage ? (
              <div className="flex items-center gap-2 mb-1">
                <img src={message.userPic || 'https://via.placeholder.com/40'} alt={displayName} className="w-8 h-8 rounded-full flex-shrink-0 object-cover" />
                <p className="font-bold text-[var(--primary-color)]" style={{ fontSize: '10px' }}>{displayName}</p>
              </div>
            ) : (
              <div className="flex items-center gap-2 mb-1">
                <img src={message.userPic || currentUser.profilePic} alt="You" className="w-8 h-8 rounded-full flex-shrink-0 object-cover" />
                <p className="font-bold text-white opacity-90" style={{ fontSize: '10px' }}>You</p>
              </div>
            )}
      {message.replyTo && (
        <div 
          onClick={() => onReplyClick && onReplyClick(message.replyTo.id)}
          className={`mb-2 p-2 rounded-lg cursor-pointer border-l-4 ${isOwnMessage ? 'border-white' : 'border-[var(--primary-color)]'}`}
          style={{ fontSize: '10px', backgroundColor: isOwnMessage ? 'rgba(255, 255, 255, 0.3)' : 'rgba(29, 63, 208, 0.25)' }}
        >
                <p className="font-semibold opacity-75" style={{ fontSize: '10px' }}>{message.replyTo.userName}</p>
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
                  <p className="opacity-75 truncate" style={{ fontSize: '10px' }}>{message.replyTo.content.substring(0, 40)}</p>
                )}
              </div>
            )}
            <div className="flex items-end gap-2">
              <div className="flex-1">
                {renderContent()}
              </div>
              <div className={`flex items-center gap-1 flex-shrink-0 self-end text-xs ${isOwnMessage ? 'opacity-75' : 'text-gray-500'}`}>
                <span className="whitespace-nowrap" style={{ fontSize: '9px' }}>{new Date(message.timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</span>
              </div>
            </div>
          </div>
        </div>
        {renderMenu()}
      </>
    );
  } catch (error) {
    console.error('ChatMessage error:', error);
    return null;
  }
}