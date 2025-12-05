# Message Interactions Feature Plan

## 🎯 Feature Overview
Add Instagram-like message interactions:
- **Long press own message** → Delete option
- **Long press other's message** → React with emoji
- **Double tap message** → Quick react with ❤️
- **View reactions** → See who reacted

---

## 📋 Implementation Checklist

### Phase 1: Backend (Database & API)

#### 1.1 Update Message Model
```javascript
// backend/src/models/message.model.js
const messageSchema = new mongoose.Schema({
  // ... existing fields ...
  
  // NEW: Reactions
  reactions: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    emoji: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // NEW: Deletion tracking
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: Date,
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }
});
```

#### 1.2 Create Message Routes
```javascript
// backend/src/routes/message.route.js

// Add these routes:
router.post("/react/:messageId", protectRoute, reactToMessage);
router.delete("/react/:messageId/:emoji", protectRoute, removeReaction);
router.delete("/delete/:messageId", protectRoute, deleteMessage);
```

#### 1.3 Create Message Controller Functions
```javascript
// backend/src/controllers/message.controller.js

export const reactToMessage = async (req, res) => {
  const { messageId } = req.params;
  const { emoji } = req.body;
  const userId = req.user._id;
  
  // Add reaction logic
  // Emit socket event: "message:reacted"
};

export const removeReaction = async (req, res) => {
  const { messageId, emoji } = req.params;
  const userId = req.user._id;
  
  // Remove reaction logic
  // Emit socket event: "message:reaction-removed"
};

export const deleteMessage = async (req, res) => {
  const { messageId } = req.params;
  const userId = req.user._id;
  
  // Soft delete (mark as deleted)
  // Emit socket event: "message:deleted"
};
```

#### 1.4 Add Socket Events
```javascript
// backend/src/lib/socket.js

socket.on("message:react", ({ messageId, emoji, receiverId }) => {
  // Emit to receiver
  emitToUser(receiverId, "message:reacted", { messageId, emoji, userId });
});

socket.on("message:delete", ({ messageId, receiverId }) => {
  // Emit to receiver
  emitToUser(receiverId, "message:deleted", { messageId });
});
```

---

### Phase 2: Frontend (UI Components)

#### 2.1 Create MessageContextMenu Component
```jsx
// frontend/src/components/MessageContextMenu.jsx

const MessageContextMenu = ({ 
  message, 
  position, 
  isOwnMessage, 
  onClose,
  onDelete,
  onReact 
}) => {
  const quickReactions = ["❤️", "😂", "👍", "😮", "😢", "🔥"];
  
  return (
    <div 
      className="fixed z-50 bg-base-100 rounded-2xl shadow-2xl p-3"
      style={{ top: position.y, left: position.x }}
    >
      {/* Quick reactions */}
      <div className="flex gap-2 mb-2">
        {quickReactions.map(emoji => (
          <button
            key={emoji}
            onClick={() => onReact(emoji)}
            className="text-2xl hover:scale-125 transition"
          >
            {emoji}
          </button>
        ))}
      </div>
      
      {/* Delete option (only for own messages) */}
      {isOwnMessage && (
        <button
          onClick={onDelete}
          className="w-full text-left px-4 py-2 text-error hover:bg-base-200 rounded-lg"
        >
          Delete Message
        </button>
      )}
    </div>
  );
};
```

#### 2.2 Update ChatContainer with Long Press
```jsx
// frontend/src/components/ChatContainer.jsx

const [contextMenu, setContextMenu] = useState(null);
const longPressTimer = useRef(null);

const handleTouchStart = (e, message) => {
  longPressTimer.current = setTimeout(() => {
    const touch = e.touches[0];
    setContextMenu({
      message,
      position: { x: touch.clientX, y: touch.clientY }
    });
    // Haptic feedback
    if (navigator.vibrate) navigator.vibrate(50);
  }, 500); // 500ms long press
};

const handleTouchEnd = () => {
  if (longPressTimer.current) {
    clearTimeout(longPressTimer.current);
  }
};

// In message rendering:
<div
  onTouchStart={(e) => handleTouchStart(e, message)}
  onTouchEnd={handleTouchEnd}
  onTouchMove={handleTouchEnd}
>
  {/* Message content */}
</div>
```

#### 2.3 Add Reaction Display
```jsx
// Show reactions below message
{message.reactions && message.reactions.length > 0 && (
  <div className="flex gap-1 mt-1">
    {Object.entries(groupReactions(message.reactions)).map(([emoji, count]) => (
      <button
        key={emoji}
        className="bg-base-200 rounded-full px-2 py-0.5 text-xs flex items-center gap-1"
        onClick={() => handleReactionClick(message._id, emoji)}
      >
        <span>{emoji}</span>
        <span>{count}</span>
      </button>
    ))}
  </div>
)}
```

#### 2.4 Update Chat Store
```javascript
// frontend/src/store/useChatStore.js

reactToMessage: async (messageId, emoji) => {
  try {
    await axiosInstance.post(`/messages/react/${messageId}`, { emoji });
    // Update local state
    set((state) => ({
      messages: state.messages.map(msg =>
        msg._id === messageId
          ? { ...msg, reactions: [...(msg.reactions || []), { emoji, userId: authUser._id }] }
          : msg
      )
    }));
  } catch (error) {
    toast.error("Failed to react");
  }
},

deleteMessage: async (messageId) => {
  try {
    await axiosInstance.delete(`/messages/delete/${messageId}`);
    // Update local state
    set((state) => ({
      messages: state.messages.map(msg =>
        msg._id === messageId
          ? { ...msg, isDeleted: true, text: "This message was deleted" }
          : msg
      )
    }));
    toast.success("Message deleted");
  } catch (error) {
    toast.error("Failed to delete message");
  }
},
```

---

### Phase 3: Additional Features

#### 3.1 Double Tap to React
```jsx
const handleDoubleTap = (message) => {
  const now = Date.now();
  const DOUBLE_TAP_DELAY = 300;
  
  if (now - lastTap < DOUBLE_TAP_DELAY) {
    // Double tap detected
    reactToMessage(message._id, "❤️");
    // Show heart animation
    showHeartAnimation();
  }
  
  setLastTap(now);
};
```

#### 3.2 Reply to Message
```jsx
// Add reply functionality
const [replyingTo, setReplyingTo] = useState(null);

// In message rendering:
{message.replyTo && (
  <div className="bg-base-300 p-2 rounded-lg mb-1 text-sm opacity-70">
    Replying to: {message.replyTo.text}
  </div>
)}
```

#### 3.3 Message Info (Read Receipts)
```jsx
// Show who reacted
const MessageInfo = ({ message }) => (
  <div className="modal">
    <h3>Reactions</h3>
    {message.reactions.map(reaction => (
      <div key={reaction.userId}>
        <img src={reaction.user.avatar} />
        <span>{reaction.user.name}</span>
        <span>{reaction.emoji}</span>
      </div>
    ))}
  </div>
);
```

---

## 🎨 UI/UX Considerations

### Animations
- **Heart animation** on double tap (like Instagram)
- **Bounce effect** when reaction is added
- **Slide in** for context menu
- **Haptic feedback** on long press (mobile)

### Accessibility
- **Keyboard shortcuts** for desktop
- **Screen reader** support
- **High contrast** mode support

### Performance
- **Debounce** reaction updates
- **Optimistic UI** updates
- **Batch** socket events

---

## 🔒 Security Considerations

1. **Validate ownership** before deleting
2. **Rate limit** reactions (prevent spam)
3. **Sanitize** emoji input
4. **Check permissions** for each action

---

## 📱 Mobile Optimizations

1. **Touch-friendly** hit areas (min 44x44px)
2. **Swipe gestures** for quick actions
3. **Bottom sheet** for context menu on mobile
4. **Native feel** with haptic feedback

---

## 🧪 Testing Checklist

- [ ] Long press shows context menu
- [ ] Double tap adds heart reaction
- [ ] Reactions sync in real-time
- [ ] Delete works for own messages only
- [ ] Deleted messages show placeholder
- [ ] Reactions persist after refresh
- [ ] Works on mobile and desktop
- [ ] Handles offline scenarios
- [ ] Performance with many reactions

---

## 📊 Estimated Time

- **Backend:** 4-6 hours
- **Frontend:** 6-8 hours
- **Testing:** 2-3 hours
- **Total:** 12-17 hours

---

## 🚀 Quick Start (Minimal Implementation)

If you want to start with just the basics:

### Step 1: Add Delete Message (Simplest)
1. Add delete button on hover (desktop) or long press (mobile)
2. Soft delete in database
3. Show "Message deleted" placeholder

### Step 2: Add Quick Reactions
1. Add reaction bar below messages
2. Store reactions in database
3. Show reaction counts

### Step 3: Add Long Press Menu
1. Detect long press
2. Show context menu
3. Handle actions

---

## 💡 Alternative: Use a Library

Consider using existing libraries:
- **react-native-message-ui** (if using React Native)
- **emoji-mart** for emoji picker
- **react-use-gesture** for touch gestures

---

## 📝 Notes

This is a significant feature that will enhance user engagement. However, it requires:
- Database migrations
- API changes
- Real-time sync
- Extensive testing

**Recommendation:** Implement in phases, starting with message deletion, then reactions, then advanced features.

Would you like me to start implementing any specific part of this feature?
