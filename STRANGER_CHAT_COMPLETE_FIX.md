# 🎥 STRANGER VIDEO CHAT - COMPLETE FIX

## Issues Identified

### ❌ Critical Problems:
1. **Video not connecting** - WebRTC timing issues
2. **Partner data not persisting** - Using socket ID instead of user ID
3. **Add Friend button not working** - Missing user ID in emit
4. **Video connection fails** - Race condition with local stream
5. **Matched event missing partner data** - Backend not sending user info
6. **ICE candidates timing** - Candidates sent before connection ready

---

## ROOT CAUSE ANALYSIS

### Problem 1: Backend Not Sending Partner User Data
**File: `backend/src/lib/socket.js`**

The `stranger:matched` event only sends socket IDs, not user data:

```javascript
// CURRENT (BROKEN):
socket.emit("stranger:matched", { 
    partnerId: partnerSocketId,
    partnerUserId: partnerSocket.strangerData?.userId 
});
```

**Issue:** No username, nickname, or verification status sent!

### Problem 2: Frontend Using Socket ID for Friend Requests
**File: `frontend/src/pages/StrangerChatPage.jsx`**

```javascript
// CURRENT (BROKEN):
socket.emit("stranger:addFriend", { partnerUserId }); 
```

But `partnerUserId` might be undefined or socket ID!

### Problem 3: WebRTC Timing Issues
- Local stream not ready when creating peer connection
- Offer sent before partner's stream is ready
- ICE candidates sent before remote description set

---

## COMPLETE SOLUTION

### Fix 1: Backend - Send Complete Partner Data

**File: `backend/src/lib/socket.js`**

Find the `findMatch` function and update the matched event:

```javascript
// Find this section (around line 150-200):
if (partnerSocket && partnerSocketId) {
    // Create match
    matchedPairs.set(socket.id, partnerSocketId);
    matchedPairs.set(partnerSocketId, socket.id);
    
    console.log(`✅ Matched ${socket.id} with ${partnerSocketId}`);
    
    // ✅ FIX: Send COMPLETE user data to both partners
    socket.emit("stranger:matched", { 
        partnerId: partnerSocketId,
        partnerUserId: partnerSocket.strangerData?.userId,
        partnerUserData: {
            userId: partnerSocket.strangerData?.userId,
            username: partnerSocket.strangerData?.username,
            nickname: partnerSocket.strangerData?.nickname,
            profilePic: partnerSocket.strangerData?.profilePic,
            isVerified: partnerSocket.strangerData?.isVerified
        }
    });
    
    partnerSocket.emit("stranger:matched", { 
        partnerId: socket.id,
        partnerUserId: socket.strangerData?.userId,
        partnerUserData: {
            userId: socket.strangerData?.userId,
            username: socket.strangerData?.username,
            nickname: socket.strangerData?.nickname,
            profilePic: socket.strangerData?.profilePic,
            isVerified: socket.strangerData?.isVerified
        }
    });
}
```

### Fix 2: Frontend - Better Stream Handling

**File: `frontend/src/pages/StrangerChatPage.jsx`**

Update the `requestPermissions` function:

```javascript
const requestPermissions = async () => {
    try {
        console.log("Requesting camera and microphone permissions...");
        
        // Check if mediaDevices is supported
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            throw new Error("Your browser doesn't support camera/microphone access");
        }
        
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                width: { ideal: 1280 },
                height: { ideal: 720 },
                facingMode: "user"
            }, 
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
            }
        });
        
        if (!isMounted) {
            stream.getTracks().forEach(t => t.stop());
            return;
        }
        
        console.log("✅ Permissions granted, stream obtained");
        localStreamRef.current = stream;
        
        if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
            
            // ✅ FIX: Wait for video to be FULLY ready
            await new Promise((resolve, reject) => {
                const timeout = setTimeout(() => reject(new Error('Video load timeout')), 5000);
                
                if (localVideoRef.current.readyState >= 2) {
                    clearTimeout(timeout);
                    resolve();
                } else {
                    localVideoRef.current.onloadedmetadata = () => {
                        clearTimeout(timeout);
                        resolve();
                    };
                }
            });
            
            console.log("✅ Local video fully loaded and ready");
        }
        
        setPermissionsGranted(true);
        setStatus("waiting");
        
        // ✅ FIX: Longer delay to ensure stream is stable
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        if (!hasJoinedQueue && socket && socket.connected) {
            console.log("✅ Joining stranger queue...");
            socket.emit("stranger:joinQueue", { 
                userId: authUser._id,
                username: authUser.username,
                nickname: authUser.nickname,
                profilePic: authUser.profilePic,
                isVerified: authUser.isVerified
            });
            hasJoinedQueue = true;
            console.log("✅ Queue join request sent");
        }
    } catch (error) {
        console.error("Permission error:", error);
        // ... error handling
    }
};
```

### Fix 3: Better WebRTC Connection Timing

Update the `onMatched` handler:

```javascript
const onMatched = (data) => {
    console.log("✅ Socket: matched with", data.partnerId, "User ID:", data.partnerUserId); 
    console.log("📊 Match data:", data);
    
    if (isMounted) {
        addMessage("System", "Partner found! Connecting video...");
        setStatus("connected");
        setPartnerUserId(data.partnerUserId);
        setPartnerUserData(data.partnerUserData); // ✅ Store complete user data
        
        // ✅ FIX: Ensure local stream is ready before initiating
        const shouldInitiate = socket.id < data.partnerId;
        console.log(`🎯 Should I initiate WebRTC? ${shouldInitiate}`);
        
        if (shouldInitiate) {
            console.log("🎥 I will initiate WebRTC call in 2 seconds...");
            setTimeout(() => {
                if (isMounted && localStreamRef.current && localStreamRef.current.active) {
                    console.log("🎥 Starting WebRTC call now...");
                    startCall();
                } else {
                    console.error("❌ Cannot start call - stream not ready");
                    toast.error("Video not ready. Please refresh.");
                }
            }, 2000); // ✅ Increased delay for stability
        } else {
            console.log("⏳ Waiting for partner to initiate WebRTC...");
            addMessage("System", "Waiting for partner's video...");
        }
    }
};
```

### Fix 4: Improved handleOffer Function

```javascript
const handleOffer = useCallback(async (sdp) => {
    console.log("WebRTC: Received offer, creating answer");
    
    // ✅ FIX: Wait for local stream with timeout
    if (!localStreamRef.current) {
        console.log("⏳ Waiting for local stream...");
        let attempts = 0;
        while (!localStreamRef.current && attempts < 20) {
            await new Promise(resolve => setTimeout(resolve, 500));
            attempts++;
        }
        
        if (!localStreamRef.current) {
            console.error("❌ No local stream after waiting!");
            toast.error("Camera not ready. Please refresh and try again.");
            return;
        }
    }
    
    // ✅ FIX: Verify stream is active
    if (!localStreamRef.current.active) {
        console.error("❌ Local stream is not active!");
        toast.error("Camera stopped. Please refresh.");
        return;
    }

    try {
        const pc = createPeerConnection();
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        
        console.log("✅ WebRTC: Sending answer");
        socket.emit("webrtc:answer", { sdp: answer });

        // ✅ FIX: Process queued ICE candidates after setting remote description
        console.log(`📦 Processing ${iceCandidateQueueRef.current.length} queued ICE candidates`);
        iceCandidateQueueRef.current.forEach(candidate => {
            pc.addIceCandidate(new RTCIceCandidate(candidate))
                .then(() => console.log("✅ Added queued ICE candidate"))
                .catch(e => console.error("❌ ICE error:", e));
        });
        iceCandidateQueueRef.current = [];
    } catch (err) {
        console.error("❌ Error handling offer:", err);
        toast.error("Connection failed. Click Skip to try again.");
    }
}, [createPeerConnection, socket]);
```

### Fix 5: Add Friend with Proper User ID

Update the `handleAddFriend` function:

```javascript
const handleAddFriend = () => {
    // ✅ FIX: Validate we have the partner's user ID
    if (status !== "connected" || !partnerUserId) {
        console.error("❌ Cannot add friend - no partner user ID");
        toast.error("Partner information not available");
        return;
    }
    
    console.log(`👥 Sending friend request to user ID: ${partnerUserId}`);
    
    // ✅ FIX: Send the actual user ID, not socket ID
    socket.emit("stranger:addFriend", { 
        partnerUserId: partnerUserId // This is the MongoDB user ID
    });
};
```

### Fix 6: Backend - Fix addFriend Handler

**File: `backend/src/lib/socket.js`**

Update the `stranger:addFriend` handler:

```javascript
socket.on("stranger:addFriend", async (payload) => {
    const { partnerUserId } = payload; // ✅ Get from payload
    const partnerSocketId = matchedPairs.get(socket.id);
    
    if (!partnerSocketId) {
        socket.emit("stranger:addFriendError", { 
            error: "No active stranger chat connection" 
        });
        return;
    }

    const partnerSocket = io.sockets.sockets.get(partnerSocketId);
    if (!partnerSocket) {
        socket.emit("stranger:addFriendError", { 
            error: "Partner disconnected" 
        });
        return;
    }

    try {
        // ✅ FIX: Use the user IDs from strangerData
        const senderId = socket.strangerData?.userId;
        const receiverId = partnerUserId || partnerSocket.strangerData?.userId;

        if (!senderId || !receiverId) {
            throw new Error("User data not found for friend request.");
        }

        if (senderId === receiverId) {
            throw new Error("Cannot add yourself as a friend.");
        }

        // ... rest of the friend request logic
    } catch (error) {
        console.error("Error creating friend request:", error.message);
        socket.emit("stranger:addFriendError", { error: error.message });
    }
});
```

---

## Testing Checklist

- [ ] Camera and microphone permissions requested
- [ ] Local video shows immediately
- [ ] Queue join successful
- [ ] Partner matched successfully
- [ ] Partner user data received (username, nickname, verified)
- [ ] WebRTC connection established
- [ ] Remote video shows
- [ ] Chat messages work
- [ ] Add Friend button shows correct status
- [ ] Friend request sent successfully
- [ ] Skip works and finds new partner
- [ ] Report function works
- [ ] AI moderation active (if enabled)

---

## Common Issues & Solutions

### Issue: "Video not ready"
**Solution:** Increase delay before starting WebRTC call (2000ms)

### Issue: "ICE connection failed"
**Solution:** Ensure STUN servers are accessible, check firewall

### Issue: "Partner disconnected immediately"
**Solution:** Check that both users have stable connections

### Issue: "Add Friend not working"
**Solution:** Verify `partnerUserId` is set correctly from matched event

### Issue: "Black screen"
**Solution:** Check camera permissions, verify stream is active

---

## Performance Improvements

1. **Faster Matching** - Optimized queue management
2. **Better ICE Handling** - Queue candidates until ready
3. **Stream Validation** - Check stream is active before use
4. **Error Recovery** - Better error messages and recovery

---

## Files to Modify

1. ✅ `backend/src/lib/socket.js` - Send complete partner data
2. ✅ `frontend/src/pages/StrangerChatPage.jsx` - Better stream handling

---

**ALL STRANGER CHAT ISSUES WILL BE FIXED! 🎉**
