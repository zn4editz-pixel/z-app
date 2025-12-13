// 🔧 SOCKET DEBUG & FIX SCRIPT
// Add this to browser console to debug socket issues

console.log('🔧 SOCKET DEBUG STARTED');

// Check if socket exists
const authStore = window.useAuthStore?.getState?.();
const socket = authStore?.socket;

console.log('📊 SOCKET STATUS:');
console.log('  Socket exists:', !!socket);
console.log('  Socket connected:', socket?.connected);
console.log('  Socket ID:', socket?.id);
console.log('  Auth user:', authStore?.authUser?.id);

if (socket) {
  console.log('🔌 TESTING SOCKET CONNECTION:');
  
  // Test socket connection
  socket.emit('test-connection', { message: 'Testing from frontend' });
  
  // Listen for test response
  socket.on('test-response', (data) => {
    console.log('✅ Socket test successful:', data);
  });
  
  // Check current listeners
  console.log('📡 CURRENT SOCKET LISTENERS:');
  console.log('  newMessage listeners:', socket.listeners('newMessage').length);
  console.log('  messageDelivered listeners:', socket.listeners('messageDelivered').length);
  console.log('  connect listeners:', socket.listeners('connect').length);
  
  // Force re-subscribe to messages
  console.log('🔄 FORCE RE-SUBSCRIBING TO MESSAGES:');
  const chatStore = window.useChatStore?.getState?.();
  if (chatStore?.subscribeToMessages) {
    chatStore.subscribeToMessages();
    console.log('✅ Re-subscribed to messages');
  }
  
  // Test message sending
  console.log('🧪 TESTING MESSAGE SEND:');
  socket.emit('sendMessage', {
    receiverId: 'test-user',
    text: 'Test message from debug script',
    tempId: 'debug-' + Date.now()
  });
  
} else {
  console.error('❌ NO SOCKET FOUND - Socket connection not established');
  console.log('🔧 TROUBLESHOOTING STEPS:');
  console.log('1. Check if backend is running on port 5001');
  console.log('2. Check browser network tab for socket connection errors');
  console.log('3. Verify auth token is valid');
  console.log('4. Try refreshing the page');
}

console.log('🔧 SOCKET DEBUG COMPLETE');