function ChatInput({ onSend, replyingTo, onCancelReply, onTyping }) {
  try {
    const [text, setText] = React.useState('');
    const [attachmentPreview, setAttachmentPreview] = React.useState(null);
    const fileInputRef = React.useRef(null);
    const textareaRef = React.useRef(null);
    const typingTimeoutRef = React.useRef(null);

    const handleTextChange = (e) => {
      const value = e.target.value;
      setText(value);
      
      e.target.style.height = 'auto';
      e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
      
      if (onTyping) {
        onTyping(true);
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        typingTimeoutRef.current = setTimeout(() => {
          onTyping(false);
        }, 3000);
      }
    };

    const handleSend = () => {
      if (attachmentPreview) {
        onSend(attachmentPreview.content, attachmentPreview.type, attachmentPreview.fileName);
        setAttachmentPreview(null);
      } else if (text.trim()) {
        onSend(text.trim(), 'text');
        setText('');
        if (textareaRef.current) {
          textareaRef.current.style.height = '40px';
        }
      }
      if (onTyping) onTyping(false);
    };

    const handleFileUpload = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          const fileType = file.type.startsWith('image/') ? 'image' : 
                          file.type.startsWith('video/') ? 'video' : 'file';
          setAttachmentPreview({
            content: reader.result,
            type: fileType,
            fileName: file.name
          });
        };
        reader.readAsDataURL(file);
      }
      e.target.value = '';
    };

    return (
      <div className="bg-white border-t fixed bottom-0 left-0 right-0 z-30">
        {attachmentPreview && (
          <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border-b">
            {attachmentPreview.type === 'image' && (
              <img src={attachmentPreview.content} className="w-16 h-16 rounded object-cover" />
            )}
            {attachmentPreview.type === 'video' && (
              <video src={attachmentPreview.content} className="w-16 h-16 rounded object-cover" />
            )}
            {attachmentPreview.type === 'file' && (
              <div className="flex items-center gap-2 p-2 bg-gray-200 rounded">
                <div className="icon-file text-lg"></div>
                <span className="text-xs">{attachmentPreview.fileName}</span>
              </div>
            )}
            <button onClick={() => setAttachmentPreview(null)} className="ml-auto p-1">
              <div className="icon-x text-base text-gray-500"></div>
            </button>
          </div>
        )}
        {replyingTo && (
          <div className="flex items-center gap-2 px-3 py-2 border-l-4 border-[var(--primary-color)]" style={{ backgroundColor: 'rgba(29, 63, 208, 0.15)' }}>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-[var(--primary-color)] truncate">{replyingTo.userName}</p>
              {replyingTo.type === 'image' ? (
                <div className="flex items-center gap-1">
                  <div className="icon-image text-xs"></div>
                  <span className="text-xs text-gray-600">Photo</span>
                </div>
              ) : replyingTo.type === 'video' ? (
                <div className="flex items-center gap-1">
                  <div className="icon-video text-xs"></div>
                  <span className="text-xs text-gray-600">Video</span>
                </div>
              ) : replyingTo.type === 'file' ? (
                <div className="flex items-center gap-1">
                  <div className="icon-file text-xs"></div>
                  <span className="text-xs text-gray-600">{replyingTo.fileName}</span>
                </div>
              ) : (
                <p className="text-xs text-gray-600 truncate">{replyingTo.content}</p>
              )}
            </div>
            <button onClick={onCancelReply} className="p-1">
              <div className="icon-x text-base text-gray-500"></div>
            </button>
          </div>
        )}
        <div className="p-3">
          <div className="flex items-center gap-2">
            <input 
              ref={fileInputRef}
              type="file" 
              accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar" 
              onChange={handleFileUpload}
              className="hidden"
            />
            <button onClick={() => fileInputRef.current.click()} className="p-2 text-gray-500 hover:text-[var(--primary-color)]">
              <div className="icon-paperclip text-xl"></div>
            </button>
            <textarea 
              ref={textareaRef}
              value={text}
              onChange={handleTextChange}
              placeholder="Type a message..."
              rows="1"
              className="flex-1 px-4 py-2 border rounded-3xl focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] resize-none overflow-y-auto"
              style={{ 
                minHeight: '40px',
                maxHeight: '120px',
                height: 'auto'
              }}
            />
            <button onClick={handleSend} className="p-2 bg-[var(--primary-color)] text-white rounded-full hover:opacity-90">
              <div className="icon-send text-xl"></div>
            </button>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('ChatInput error:', error);
    return null;
  }
}