# 🎉 Stranger Chat - New Interactive Features

## Features to Implement

### 1. Video Swap (WhatsApp-style)
**Feature**: Tap self camera to swap between main/PiP view
- Click small camera → becomes main view
- Partner video → becomes small PiP
- Click again → swap back

### 2. Camera Flip (Mobile)
**Feature**: Switch between front/back camera
- Button to flip camera
- Works on mobile devices
- Smooth transition

### 3. Animated Reactions (Instagram Live/Google Meet style)
**Feature**: Send floating emoji reactions
- Reaction buttons (❤️ 👍 😂 🎉 😊)
- Emojis float up and fade out
- Partner sees your reactions in real-time
- Beautiful animations

## Implementation Steps

### Step 1: Add State Variables (✅ DONE)
```javascript
const [isVideoSwapped, setIsVideoSwapped] = useState(false);
const [facingMode, setFacingMode] = useState("user");
const [reactions, setReactions] = useState([]);
```

### Step 2: Add Handler Functions (✅ DONE)
```javascript
const handleVideoSwap = () => {
	setIsVideoSwapped(!isVideoSwapped);
};

const handleCameraFlip = async () => {
	// Switch camera logic
};

const sendReaction = (emoji) => {
	// Send reaction logic
};
```

### Step 3: Add Socket Listener for Reactions
```javascript
const onReaction = ({ emoji }) => {
	const reaction = {
		id: Date.now() + Math.random(),
		emoji,
		x: Math.random() * 80 + 10,
	};
	setReactions(prev => [...prev, reaction]);
	setTimeout(() => {
		setReactions(prev => prev.filter(r => r.id !== reaction.id));
	}, 3000);
};
socket.on("stranger:reaction", onReaction);
```

### Step 4: Update Video Display with Swap Logic
```javascript
{/* Main Video - Swappable */}
<video 
	ref={isVideoSwapped ? localVideoRef : remoteVideoRef}
	autoPlay 
	playsInline 
	className="absolute inset-0 w-full h-full object-cover"
	style={isVideoSwapped ? { transform: 'scaleX(-1)' } : {}}
/>

{/* PiP Video - Swappable with Click */}
<div className="absolute top-20 right-4 z-20 cursor-pointer" onClick={handleVideoSwap}>
	<div className="relative w-32 h-44 sm:w-36 sm:h-48 md:w-40 md:h-56 rounded-xl overflow-hidden shadow-2xl border-2 border-primary bg-base-300">
		<video 
			ref={isVideoSwapped ? remoteVideoRef : localVideoRef}
			autoPlay 
			playsInline 
			muted={!isVideoSwapped}
			className="w-full h-full object-cover"
			style={!isVideoSwapped ? { transform: 'scaleX(-1)' } : {}}
		/>
		<div className="absolute inset-0 bg-black/20 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
			<Repeat className="w-8 h-8 text-white" />
		</div>
		<div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-2">
			<p className="text-white text-xs font-bold">{isVideoSwapped ? "Stranger" : "You"}</p>
		</div>
	</div>
</div>
```

### Step 5: Add Camera Flip Button
```javascript
{/* Camera Controls - Floating */}
{status === "connected" && (
	<div className="absolute top-20 left-4 z-20 flex flex-col gap-2">
		{/* Camera Flip Button */}
		<button
			onClick={handleCameraFlip}
			className="btn btn-circle btn-primary shadow-xl"
			title="Flip Camera"
		>
			<SwitchCamera size={20} />
		</button>
	</div>
)}
```

### Step 6: Add Reaction Buttons
```javascript
{/* Reaction Buttons - Bottom Right */}
{status === "connected" && (
	<div className="absolute bottom-28 right-4 z-20 flex flex-col gap-2">
		<button onClick={() => sendReaction("❤️")} className="btn btn-circle btn-sm bg-red-500 hover:bg-red-600 border-none shadow-xl">
			<Heart size={18} className="text-white fill-white" />
		</button>
		<button onClick={() => sendReaction("👍")} className="btn btn-circle btn-sm bg-blue-500 hover:bg-blue-600 border-none shadow-xl">
			<ThumbsUp size={18} className="text-white" />
		</button>
		<button onClick={() => sendReaction("😂")} className="btn btn-circle btn-sm bg-yellow-500 hover:bg-yellow-600 border-none shadow-xl">
			<Laugh size={18} className="text-white" />
		</button>
		<button onClick={() => sendReaction("🎉")} className="btn btn-circle btn-sm bg-purple-500 hover:bg-purple-600 border-none shadow-xl">
			<PartyPopper size={18} className="text-white" />
		</button>
		<button onClick={() => sendReaction("😊")} className="btn btn-circle btn-sm bg-green-500 hover:bg-green-600 border-none shadow-xl">
			<Smile size={18} className="text-white" />
		</button>
	</div>
)}
```

### Step 7: Add Floating Reactions Animation
```javascript
{/* Floating Reactions */}
<div className="absolute inset-0 pointer-events-none z-30">
	{reactions.map((reaction) => (
		<div
			key={reaction.id}
			className="absolute bottom-0 animate-float-up"
			style={{
				left: `${reaction.x}%`,
				fontSize: '3rem',
			}}
		>
			{reaction.emoji}
		</div>
	))}
</div>
```

### Step 8: Add CSS Animation
```css
@keyframes float-up {
	0% {
		transform: translateY(0) scale(0);
		opacity: 0;
	}
	10% {
		transform: translateY(-20px) scale(1);
		opacity: 1;
	}
	90% {
		transform: translateY(-400px) scale(1.2);
		opacity: 0.8;
	}
	100% {
		transform: translateY(-500px) scale(0.5);
		opacity: 0;
	}
}

.animate-float-up {
	animation: float-up 3s ease-out forwards;
}
```

### Step 9: Backend Socket Handler
Add to `backend/src/lib/socket.js`:
```javascript
socket.on("stranger:reaction", ({ emoji }) => {
	const partnerId = strangerPairs.get(socket.id);
	if (partnerId) {
		io.to(partnerId).emit("stranger:reaction", { emoji });
	}
});
```

## Features Summary

✅ **Video Swap**: Click PiP to swap views  
✅ **Camera Flip**: Switch front/back camera  
✅ **Reactions**: 5 animated emoji reactions  
✅ **Real-time**: Partner sees reactions instantly  
✅ **Animations**: Beautiful floating effect  

## User Experience

1. **Video Swap**: Tap small camera → swap views (like WhatsApp)
2. **Camera Flip**: Tap flip button → switch camera (mobile)
3. **Reactions**: Tap emoji → floats up beautifully → partner sees it

## Next Steps

1. Apply UI changes to StrangerChatPage.jsx
2. Add socket handler to backend
3. Test all features
4. Polish animations

---

**Status**: Implementation guide ready  
**Complexity**: Medium  
**Impact**: High - Much more interactive!
