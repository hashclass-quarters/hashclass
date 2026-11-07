class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }
  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return <div className="p-4">Something went wrong</div>;
    }
    return this.props.children;
  }
}

function ChatApp() {
  try {
    const [user, setUser] = React.useState(null);
    const [messages, setMessages] = React.useState([]);
    const [replyingTo, setReplyingTo] = React.useState(null);
    const [typingUsers, setTypingUsers] = React.useState([]);
    const [autoScroll, setAutoScroll] = React.useState(true);
    const [showScrollButton, setShowScrollButton] = React.useState(false);
    const [highlightedMessageId, setHighlightedMessageId] = React.useState(null);
    const [firstUnreadId, setFirstUnreadId] = React.useState(null);
    const [showUnreadLabel, setShowUnreadLabel] = React.useState(false);
    const [connectionError, setConnectionError] = React.useState(false);
    const messagesEndRef = React.useRef(null);
    const messagesContainerRef = React.useRef(null);

    React.useEffect(() => {
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      if (!currentUser.regNumber || !window.HC.getToken()) {
        window.location.href = 'index.html';
        return;
      }
      setUser(currentUser);
      
      let msgInterval;
      let stopRealtime = null;
      let typingInterval;
      let retryTimeout;
      
      const initChat = async () => {
        setConnectionError(false);
        
        loadMessages(true);
        
        // new messages arrive instantly through Realtime; polling is only a safety net
        if (window.chatRealtime) {
          stopRealtime = window.chatRealtime.onMessage(() => loadMessages(false));
        }
        msgInterval = setInterval(() => {
          loadMessages(false);
        }, 20000);
        
        typingInterval = setInterval(checkTyping, 1000);
      };
      
      initChat();
      
      return () => {
        if (msgInterval) clearInterval(msgInterval);
        if (stopRealtime) stopRealtime();
        if (typingInterval) clearInterval(typingInterval);
        if (retryTimeout) clearTimeout(retryTimeout);
        if (currentUser.regNumber) {
          setTypingStatus(currentUser.regNumber, false);
        }
      };
    }, []);

    React.useEffect(() => {
      if (autoScroll && messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }, [messages, autoScroll]);

    const loadMessages = async (isInitial = false) => {
      const allMessages = await getAllChatMessages();
      
      setMessages(prev => {
        const optimisticMessages = prev.filter(m => m.isOptimistic);
        return [...optimisticMessages, ...allMessages];
      });
      
      if (user && isInitial) {
        const firstUnread = allMessages.find(msg => {
          const readBy = msg.readBy || '';
          return !readBy.split(',').includes(user.regNumber) && msg.userId !== user.regNumber;
        });
        
        if (firstUnread) {
          setFirstUnreadId(firstUnread.id);
          setShowUnreadLabel(true);
          setTimeout(() => setShowUnreadLabel(false), 5000);
          
          setTimeout(() => {
            const msgElement = document.querySelector(`[data-message-id="${firstUnread.id}"]`);
            if (msgElement) {
              msgElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }, 300);
        } else {
          setTimeout(scrollToBottom, 100);
        }
      }
      
      if (user && allMessages.length > 0) {
        const unreadMessages = allMessages.filter(msg => {
          const readBy = msg.readBy || '';
          return msg.userId !== user.regNumber && !readBy.split(',').includes(user.regNumber);
        });
        
        if (unreadMessages.length > 0) {
          unreadMessages.forEach(msg => {
            markMessageAsRead(msg.id, user.regNumber);
          });
        }
      }
      
      setConnectionError(false);
    };

    const checkTyping = () => {
      if (user) {
        const users = getTypingUsers(user.regNumber);
        setTypingUsers(users);
      }
    };

    const handleScroll = (e) => {
      const { scrollTop, scrollHeight, clientHeight } = e.target;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
      setAutoScroll(isAtBottom);
      setShowScrollButton(!isAtBottom);
    };

    const scrollToBottom = () => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    };

    const handleSend = async (content, type, fileName) => {
      const tempId = 'temp_' + Date.now();
      const currentReply = replyingTo;
      
      const tempMessage = {
        id: tempId,
        userId: user.regNumber,
        userName: user.name,
        userPic: user.profilePic,
        content,
        type,
        fileName: fileName || '',
        replyTo: currentReply,
        timestamp: Date.now(),
        readBy: user.regNumber,
        isOptimistic: true
      };
      
      setMessages(prev => [...prev, tempMessage]);
      setReplyingTo(null);
      setAutoScroll(true);
      setTimeout(scrollToBottom, 50);
      
      try {
        const result = await sendChatMessage(user.regNumber, user.name, user.profilePic, content, type, currentReply, fileName);
        
        setMessages(prev => prev.map(m => 
          m.id === tempId ? { ...m, id: result.objectId, isOptimistic: false } : m
        ));
        
        setTimeout(() => loadMessages(false), 500);
      } catch (error) {
        setMessages(prev => prev.filter(m => m.id !== tempId));
        alert('Failed to send message');
      }
    };

    const handleReply = (msg) => {
      setReplyingTo(msg);
      setTimeout(() => {
        const textarea = document.querySelector('textarea[placeholder="Type a message..."]');
        if (textarea) textarea.focus();
      }, 100);
    };

    const handleDelete = async (msgId, deleteForEveryone) => {
      setMessages(prev => prev.filter(m => m.id !== msgId));
      
      try {
        await deleteChatMessage(msgId, deleteForEveryone);
        setTimeout(() => loadMessages(false), 500);
      } catch (error) {
        loadMessages(false);
      }
    };

    const handleReplyClick = (replyToId) => {
      const msgElement = document.querySelector(`[data-message-id="${replyToId}"]`);
      if (msgElement) {
        msgElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setHighlightedMessageId(replyToId);
        setTimeout(() => setHighlightedMessageId(null), 2000);
      }
    };

    const handleScrollToBottom = () => {
      setAutoScroll(true);
      scrollToBottom();
    };

    if (!user) return null;

    return (
      <div className="flex flex-col overflow-hidden relative" style={{ backgroundColor: '#F3E8FF', height: '100vh', height: '100dvh' }}>
        {connectionError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 fixed top-0 left-0 right-0 z-50 flex items-center gap-2">
            <div className="icon-circle-alert text-lg"></div>
            <div className="flex-1">
              <p className="font-semibold text-sm">Connection Error</p>
              <p className="text-xs">Unable to connect. Please refresh the page.</p>
            </div>
            <button onClick={() => window.location.reload()} className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700">
              Refresh
            </button>
          </div>
        )}
        <div className="bg-[var(--primary-color)] text-white p-4 flex items-center gap-3 shadow-md fixed top-0 left-0 right-0 z-50" style={{ marginTop: connectionError ? '52px' : '0' }}>
          <button onClick={() => window.location.href = 'user-dashboard.html'}>
            <div className="icon-arrow-left text-xl"></div>
          </button>
          <img src="https://app.trickle.so/storage/public/images/usr_1859567910000001/8bc308c7-6235-4d78-a090-8bd032e869f0.png" alt="Logo" className="w-10 h-10 rounded-full" />
          <div className="flex-1">
            <h1 className="font-bold">HashCLASS Chat</h1>
            {typingUsers.length > 0 ? (
              <p className="text-xs opacity-90">Someone is typing...</p>
            ) : (
              <p className="text-xs opacity-90">The Golden Minds</p>
            )}
          </div>
        </div>
        <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ marginTop: '72px', marginBottom: replyingTo ? '140px' : '80px', opacity: 0.12 }}>
          <div className="icon-book-open text-xs text-[var(--primary-color)] absolute" style={{ top: '1%', left: '3%' }}></div>
          <div className="icon-pencil text-xs text-[var(--primary-color)] absolute" style={{ top: '1%', left: '13%' }}></div>
          <div className="icon-graduation-cap text-xs text-[var(--primary-color)] absolute" style={{ top: '1%', left: '23%' }}></div>
          <div className="icon-book text-xs text-[var(--primary-color)] absolute" style={{ top: '1%', left: '33%' }}></div>
          <div className="icon-lightbulb text-xs text-[var(--primary-color)] absolute" style={{ top: '1%', left: '43%' }}></div>
          <div className="icon-notebook text-xs text-[var(--primary-color)] absolute" style={{ top: '1%', left: '53%' }}></div>
          <div className="icon-file-text text-xs text-[var(--primary-color)] absolute" style={{ top: '1%', left: '63%' }}></div>
          <div className="icon-calculator text-xs text-[var(--primary-color)] absolute" style={{ top: '1%', left: '73%' }}></div>
          <div className="icon-microscope text-xs text-[var(--primary-color)] absolute" style={{ top: '1%', left: '83%' }}></div>
          <div className="icon-globe text-xs text-[var(--primary-color)] absolute" style={{ top: '1%', left: '93%' }}></div>
          
          <div className="icon-award text-xs text-[var(--primary-color)] absolute" style={{ top: '5%', left: '8%' }}></div>
          <div className="icon-beaker text-xs text-[var(--primary-color)] absolute" style={{ top: '5%', left: '18%' }}></div>
          <div className="icon-briefcase text-xs text-[var(--primary-color)] absolute" style={{ top: '5%', left: '28%' }}></div>
          <div className="icon-calendar text-xs text-[var(--primary-color)] absolute" style={{ top: '5%', left: '38%' }}></div>
          <div className="icon-clipboard text-xs text-[var(--primary-color)] absolute" style={{ top: '5%', left: '48%' }}></div>
          <div className="icon-compass text-xs text-[var(--primary-color)] absolute" style={{ top: '5%', left: '58%' }}></div>
          <div className="icon-library text-xs text-[var(--primary-color)] absolute" style={{ top: '5%', left: '68%' }}></div>
          <div className="icon-ruler text-xs text-[var(--primary-color)] absolute" style={{ top: '5%', left: '78%' }}></div>
          <div className="icon-backpack text-xs text-[var(--primary-color)] absolute" style={{ top: '5%', left: '88%' }}></div>
          
          <div className="icon-atom text-xs text-[var(--primary-color)] absolute" style={{ top: '9%', left: '5%' }}></div>
          <div className="icon-flask-conical text-xs text-[var(--primary-color)] absolute" style={{ top: '9%', left: '15%' }}></div>
          <div className="icon-bookmark text-xs text-[var(--primary-color)] absolute" style={{ top: '9%', left: '25%' }}></div>
          <div className="icon-trophy text-xs text-[var(--primary-color)] absolute" style={{ top: '9%', left: '35%' }}></div>
          <div className="icon-target text-xs text-[var(--primary-color)] absolute" style={{ top: '9%', left: '45%' }}></div>
          <div className="icon-palette text-xs text-[var(--primary-color)] absolute" style={{ top: '9%', left: '55%' }}></div>
          <div className="icon-pen-tool text-xs text-[var(--primary-color)] absolute" style={{ top: '9%', left: '65%' }}></div>
          <div className="icon-layers text-xs text-[var(--primary-color)] absolute" style={{ top: '9%', left: '75%' }}></div>
          <div className="icon-paperclip text-xs text-[var(--primary-color)] absolute" style={{ top: '9%', left: '85%' }}></div>
          <div className="icon-scissors text-xs text-[var(--primary-color)] absolute" style={{ top: '9%', left: '95%' }}></div>
          
          <div className="icon-scan text-xs text-[var(--primary-color)] absolute" style={{ top: '13%', left: '2%' }}></div>
          <div className="icon-printer text-xs text-[var(--primary-color)] absolute" style={{ top: '13%', left: '12%' }}></div>
          <div className="icon-git-branch text-xs text-[var(--primary-color)] absolute" style={{ top: '13%', left: '22%' }}></div>
          <div className="icon-feather text-xs text-[var(--primary-color)] absolute" style={{ top: '13%', left: '32%' }}></div>
          <div className="icon-command text-xs text-[var(--primary-color)] absolute" style={{ top: '13%', left: '42%' }}></div>
          <div className="icon-box text-xs text-[var(--primary-color)] absolute" style={{ top: '13%', left: '52%' }}></div>
          <div className="icon-anchor text-xs text-[var(--primary-color)] absolute" style={{ top: '13%', left: '62%' }}></div>
          <div className="icon-aperture text-xs text-[var(--primary-color)] absolute" style={{ top: '13%', left: '72%' }}></div>
          <div className="icon-archive text-xs text-[var(--primary-color)] absolute" style={{ top: '13%', left: '82%' }}></div>
          <div className="icon-codesandbox text-xs text-[var(--primary-color)] absolute" style={{ top: '13%', left: '92%' }}></div>
          
          <div className="icon-cpu text-xs text-[var(--primary-color)] absolute" style={{ top: '17%', left: '7%' }}></div>
          <div className="icon-database text-xs text-[var(--primary-color)] absolute" style={{ top: '17%', left: '17%' }}></div>
          <div className="icon-crosshair text-xs text-[var(--primary-color)] absolute" style={{ top: '17%', left: '27%' }}></div>
          <div className="icon-droplet text-xs text-[var(--primary-color)] absolute" style={{ top: '17%', left: '37%' }}></div>
          <div className="icon-filter text-xs text-[var(--primary-color)] absolute" style={{ top: '17%', left: '47%' }}></div>
          <div className="icon-flag text-xs text-[var(--primary-color)] absolute" style={{ top: '17%', left: '57%' }}></div>
          <div className="icon-grid text-xs text-[var(--primary-color)] absolute" style={{ top: '17%', left: '67%' }}></div>
          <div className="icon-hash text-xs text-[var(--primary-color)] absolute" style={{ top: '17%', left: '77%' }}></div>
          <div className="icon-hexagon text-xs text-[var(--primary-color)] absolute" style={{ top: '17%', left: '87%' }}></div>
          
          <div className="icon-key text-xs text-[var(--primary-color)] absolute" style={{ top: '21%', left: '4%' }}></div>
          <div className="icon-layout text-xs text-[var(--primary-color)] absolute" style={{ top: '21%', left: '14%' }}></div>
          <div className="icon-link text-xs text-[var(--primary-color)] absolute" style={{ top: '21%', left: '24%' }}></div>
          <div className="icon-loader text-xs text-[var(--primary-color)] absolute" style={{ top: '21%', left: '34%' }}></div>
          <div className="icon-lock text-xs text-[var(--primary-color)] absolute" style={{ top: '21%', left: '44%' }}></div>
          <div className="icon-map text-xs text-[var(--primary-color)] absolute" style={{ top: '21%', left: '54%' }}></div>
          <div className="icon-map-pin text-xs text-[var(--primary-color)] absolute" style={{ top: '21%', left: '64%' }}></div>
          <div className="icon-monitor text-xs text-[var(--primary-color)] absolute" style={{ top: '21%', left: '74%' }}></div>
          <div className="icon-octagon text-xs text-[var(--primary-color)] absolute" style={{ top: '21%', left: '84%' }}></div>
          <div className="icon-package text-xs text-[var(--primary-color)] absolute" style={{ top: '21%', left: '94%' }}></div>
          
          <div className="icon-percent text-xs text-[var(--primary-color)] absolute" style={{ top: '25%', left: '1%' }}></div>
          <div className="icon-pie-chart text-xs text-[var(--primary-color)] absolute" style={{ top: '25%', left: '11%' }}></div>
          <div className="icon-pocket text-xs text-[var(--primary-color)] absolute" style={{ top: '25%', left: '21%' }}></div>
          <div className="icon-radio text-xs text-[var(--primary-color)] absolute" style={{ top: '25%', left: '31%' }}></div>
          <div className="icon-search text-xs text-[var(--primary-color)] absolute" style={{ top: '25%', left: '41%' }}></div>
          <div className="icon-server text-xs text-[var(--primary-color)] absolute" style={{ top: '25%', left: '51%' }}></div>
          <div className="icon-settings text-xs text-[var(--primary-color)] absolute" style={{ top: '25%', left: '61%' }}></div>
          <div className="icon-shield text-xs text-[var(--primary-color)] absolute" style={{ top: '25%', left: '71%' }}></div>
          <div className="icon-sliders text-xs text-[var(--primary-color)] absolute" style={{ top: '25%', left: '81%' }}></div>
          <div className="icon-square text-xs text-[var(--primary-color)] absolute" style={{ top: '25%', left: '91%' }}></div>
          
          <div className="icon-star text-xs text-[var(--primary-color)] absolute" style={{ top: '29%', left: '6%' }}></div>
          <div className="icon-tag text-xs text-[var(--primary-color)] absolute" style={{ top: '29%', left: '16%' }}></div>
          <div className="icon-terminal text-xs text-[var(--primary-color)] absolute" style={{ top: '29%', left: '26%' }}></div>
          <div className="icon-thermometer text-xs text-[var(--primary-color)] absolute" style={{ top: '29%', left: '36%' }}></div>
          <div className="icon-tool text-xs text-[var(--primary-color)] absolute" style={{ top: '29%', left: '46%' }}></div>
          <div className="icon-triangle text-xs text-[var(--primary-color)] absolute" style={{ top: '29%', left: '56%' }}></div>
          <div className="icon-umbrella text-xs text-[var(--primary-color)] absolute" style={{ top: '29%', left: '66%' }}></div>
          <div className="icon-zap text-xs text-[var(--primary-color)] absolute" style={{ top: '29%', left: '76%' }}></div>
          <div className="icon-wifi text-xs text-[var(--primary-color)] absolute" style={{ top: '29%', left: '86%' }}></div>
          
          <div className="icon-wind text-xs text-[var(--primary-color)] absolute" style={{ top: '33%', left: '3%' }}></div>
          <div className="icon-zoom-in text-xs text-[var(--primary-color)] absolute" style={{ top: '33%', left: '13%' }}></div>
          <div className="icon-eye text-xs text-[var(--primary-color)] absolute" style={{ top: '33%', left: '23%' }}></div>
          <div className="icon-heart text-xs text-[var(--primary-color)] absolute" style={{ top: '33%', left: '33%' }}></div>
          <div className="icon-mail text-xs text-[var(--primary-color)] absolute" style={{ top: '33%', left: '43%' }}></div>
          <div className="icon-phone text-xs text-[var(--primary-color)] absolute" style={{ top: '33%', left: '53%' }}></div>
          <div className="icon-user text-xs text-[var(--primary-color)] absolute" style={{ top: '33%', left: '63%' }}></div>
          <div className="icon-home text-xs text-[var(--primary-color)] absolute" style={{ top: '33%', left: '73%' }}></div>
          <div className="icon-image text-xs text-[var(--primary-color)] absolute" style={{ top: '33%', left: '83%' }}></div>
          <div className="icon-music text-xs text-[var(--primary-color)] absolute" style={{ top: '33%', left: '93%' }}></div>
          
          <div className="icon-video text-xs text-[var(--primary-color)] absolute" style={{ top: '37%', left: '8%' }}></div>
          <div className="icon-camera text-xs text-[var(--primary-color)] absolute" style={{ top: '37%', left: '18%' }}></div>
          <div className="icon-microphone text-xs text-[var(--primary-color)] absolute" style={{ top: '37%', left: '28%' }}></div>
          <div className="icon-volume-2 text-xs text-[var(--primary-color)] absolute" style={{ top: '37%', left: '38%' }}></div>
          <div className="icon-bell text-xs text-[var(--primary-color)] absolute" style={{ top: '37%', left: '48%' }}></div>
          <div className="icon-message-square text-xs text-[var(--primary-color)] absolute" style={{ top: '37%', left: '58%' }}></div>
          <div className="icon-send text-xs text-[var(--primary-color)] absolute" style={{ top: '37%', left: '68%' }}></div>
          <div className="icon-share-2 text-xs text-[var(--primary-color)] absolute" style={{ top: '37%', left: '78%' }}></div>
          <div className="icon-download text-xs text-[var(--primary-color)] absolute" style={{ top: '37%', left: '88%' }}></div>
          
          <div className="icon-upload text-xs text-[var(--primary-color)] absolute" style={{ top: '41%', left: '5%' }}></div>
          <div className="icon-check text-xs text-[var(--primary-color)] absolute" style={{ top: '41%', left: '15%' }}></div>
          <div className="icon-x text-xs text-[var(--primary-color)] absolute" style={{ top: '41%', left: '25%' }}></div>
          <div className="icon-plus text-xs text-[var(--primary-color)] absolute" style={{ top: '41%', left: '35%' }}></div>
          <div className="icon-minus text-xs text-[var(--primary-color)] absolute" style={{ top: '41%', left: '45%' }}></div>
          <div className="icon-edit text-xs text-[var(--primary-color)] absolute" style={{ top: '41%', left: '55%' }}></div>
          <div className="icon-trash-2 text-xs text-[var(--primary-color)] absolute" style={{ top: '41%', left: '65%' }}></div>
          <div className="icon-copy text-xs text-[var(--primary-color)] absolute" style={{ top: '41%', left: '75%' }}></div>
          <div className="icon-save text-xs text-[var(--primary-color)] absolute" style={{ top: '41%', left: '85%' }}></div>
          <div className="icon-folder text-xs text-[var(--primary-color)] absolute" style={{ top: '41%', left: '95%' }}></div>
          
          <div className="icon-file text-xs text-[var(--primary-color)] absolute" style={{ top: '45%', left: '2%' }}></div>
          <div className="icon-folder-open text-xs text-[var(--primary-color)] absolute" style={{ top: '45%', left: '12%' }}></div>
          <div className="icon-hard-drive text-xs text-[var(--primary-color)] absolute" style={{ top: '45%', left: '22%' }}></div>
          <div className="icon-smartphone text-xs text-[var(--primary-color)] absolute" style={{ top: '45%', left: '32%' }}></div>
          <div className="icon-tablet text-xs text-[var(--primary-color)] absolute" style={{ top: '45%', left: '42%' }}></div>
          <div className="icon-watch text-xs text-[var(--primary-color)] absolute" style={{ top: '45%', left: '52%' }}></div>
          <div className="icon-laptop text-xs text-[var(--primary-color)] absolute" style={{ top: '45%', left: '62%' }}></div>
          <div className="icon-tv text-xs text-[var(--primary-color)] absolute" style={{ top: '45%', left: '72%' }}></div>
          <div className="icon-bluetooth text-xs text-[var(--primary-color)] absolute" style={{ top: '45%', left: '82%' }}></div>
          <div className="icon-cast text-xs text-[var(--primary-color)] absolute" style={{ top: '45%', left: '92%' }}></div>
          
          <div className="icon-grid text-xl text-[var(--primary-color)] absolute" style={{ top: '56%', left: '6%' }}></div>
          <div className="icon-hash text-2xl text-[var(--primary-color)] absolute" style={{ top: '56%', right: '42%' }}></div>
          <div className="icon-hexagon text-xl text-[var(--primary-color)] absolute" style={{ top: '56%', left: '38%' }}></div>
          <div className="icon-key text-2xl text-[var(--primary-color)] absolute" style={{ top: '56%', right: '18%' }}></div>
          <div className="icon-layout text-xl text-[var(--primary-color)] absolute" style={{ top: '56%', left: '72%' }}></div>
          
          <div className="icon-link text-2xl text-[var(--primary-color)] absolute" style={{ top: '62%', right: '32%' }}></div>
          <div className="icon-loader text-xl text-[var(--primary-color)] absolute" style={{ top: '62%', left: '24%' }}></div>
          <div className="icon-lock text-2xl text-[var(--primary-color)] absolute" style={{ top: '62%', right: '68%' }}></div>
          <div className="icon-map text-xl text-[var(--primary-color)] absolute" style={{ top: '62%', left: '55%' }}></div>
          <div className="icon-map-pin text-2xl text-[var(--primary-color)] absolute" style={{ top: '62%', right: '5%' }}></div>
          
          <div className="icon-monitor text-xl text-[var(--primary-color)] absolute" style={{ top: '68%', left: '15%' }}></div>
          <div className="icon-octagon text-2xl text-[var(--primary-color)] absolute" style={{ top: '68%', right: '48%' }}></div>
          <div className="icon-package text-xl text-[var(--primary-color)] absolute" style={{ top: '68%', left: '45%' }}></div>
          <div className="icon-percent text-2xl text-[var(--primary-color)] absolute" style={{ top: '68%', right: '25%' }}></div>
          <div className="icon-pie-chart text-xl text-[var(--primary-color)] absolute" style={{ top: '68%', left: '78%' }}></div>
          
          <div className="icon-pocket text-2xl text-[var(--primary-color)] absolute" style={{ top: '74%', right: '15%' }}></div>
          <div className="icon-radio text-xl text-[var(--primary-color)] absolute" style={{ top: '74%', left: '8%' }}></div>
          <div className="icon-search text-2xl text-[var(--primary-color)] absolute" style={{ top: '74%', right: '55%' }}></div>
          <div className="icon-server text-xl text-[var(--primary-color)] absolute" style={{ top: '74%', left: '62%' }}></div>
          <div className="icon-settings text-2xl text-[var(--primary-color)] absolute" style={{ top: '74%', right: '2%' }}></div>
          
          <div className="icon-shield text-xl text-[var(--primary-color)] absolute" style={{ top: '80%', left: '20%' }}></div>
          <div className="icon-sliders text-2xl text-[var(--primary-color)] absolute" style={{ top: '80%', right: '38%' }}></div>
          <div className="icon-square text-xl text-[var(--primary-color)] absolute" style={{ top: '80%', left: '52%' }}></div>
          <div className="icon-star text-2xl text-[var(--primary-color)] absolute" style={{ top: '80%', right: '12%' }}></div>
          <div className="icon-tag text-xl text-[var(--primary-color)] absolute" style={{ top: '80%', left: '82%' }}></div>
          
          <div className="icon-terminal text-2xl text-[var(--primary-color)] absolute" style={{ top: '86%', right: '28%' }}></div>
          <div className="icon-thermometer text-xl text-[var(--primary-color)] absolute" style={{ top: '86%', left: '12%' }}></div>
          <div className="icon-tool text-2xl text-[var(--primary-color)] absolute" style={{ top: '86%', right: '65%' }}></div>
          <div className="icon-triangle text-xl text-[var(--primary-color)] absolute" style={{ top: '86%', left: '48%' }}></div>
          <div className="icon-umbrella text-2xl text-[var(--primary-color)] absolute" style={{ top: '86%', right: '8%' }}></div>
          
          <div className="icon-zap text-xl text-[var(--primary-color)] absolute" style={{ top: '92%', left: '25%' }}></div>
          <div className="icon-wifi text-2xl text-[var(--primary-color)] absolute" style={{ top: '92%', right: '45%' }}></div>
          <div className="icon-wind text-xl text-[var(--primary-color)] absolute" style={{ top: '92%', left: '68%' }}></div>
          <div className="icon-zoom-in text-2xl text-[var(--primary-color)] absolute" style={{ top: '92%', right: '18%' }}></div>
        </div>
        <div 
          ref={messagesContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-3 space-y-1.5 relative z-0 chat-messages" 
          style={{ 
            marginTop: '72px', 
            marginBottom: '0px',
            paddingBottom: replyingTo ? '148px' : '88px',
            backgroundColor: 'rgba(243, 232, 255, 0.3)'
          }}
        >
          {messages.map((msg, index) => (
            <React.Fragment key={msg.id}>
              {showUnreadLabel && msg.id === firstUnreadId && (
                <div className="flex justify-center my-2">
                  <div className="bg-[var(--primary-color)] text-white px-4 py-1 rounded-full text-xs font-semibold shadow-md animate-fadeIn">
                    Unread messages
                  </div>
                </div>
              )}
              <div 
                className={`transition-all duration-500 ${highlightedMessageId === msg.id ? 'rounded-lg p-2 -mx-2' : ''}`}
                style={highlightedMessageId === msg.id ? { backgroundColor: 'rgba(139, 92, 246, 0.4)' } : {}}
              >
                <ChatMessage 
                  message={msg} 
                  currentUser={user}
                  onReply={handleReply}
                  onDelete={handleDelete}
                  onReplyClick={handleReplyClick}
                />
              </div>
            </React.Fragment>
          ))}
          <div ref={messagesEndRef} />
        </div>
        {showScrollButton && (
          <button 
            onClick={handleScrollToBottom}
            className="fixed right-4 bg-black text-white p-3 rounded-full shadow-lg hover:opacity-90 z-40 transition-all"
            style={{ bottom: replyingTo ? '156px' : '96px' }}
          >
            <div className="icon-chevron-down text-xl"></div>
          </button>
        )}
        <div className="fixed bottom-0 left-0 right-0 bg-white z-50 border-t shadow-lg">
          <ChatInput 
            onSend={handleSend} 
            replyingTo={replyingTo}
            onCancelReply={() => setReplyingTo(null)}
            onTyping={(isTyping) => setTypingStatus(user.regNumber, isTyping)}
          />
        </div>
      </div>
    );
  } catch (error) {
    console.error('ChatApp error:', error);
    return null;
  }
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<ErrorBoundary><ChatApp /></ErrorBoundary>);
