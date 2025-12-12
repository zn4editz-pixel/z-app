import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useChatStore } from '../store/useChatStore';
import { axiosInstance } from '../lib/axios';
import toast from 'react-hot-toast';

const MessageDiagnosticPage = () => {
  const [diagnostics, setDiagnostics] = useState({});
  const [testResults, setTestResults] = useState([]);
  const { authUser, socket } = useAuthStore();
  const { sendMessage, selectedUser } = useChatStore();

  const addResult = (test, status, message) => {
    setTestResults(prev => [...prev, { test, status, message, time: new Date().toLocaleTimeString() }]);
  };

  const runDiagnostics = async () => {
    setTestResults([]);
    addResult('Starting', 'info', 'Running comprehensive message sending diagnostics...');

    // Test 1: Check authentication
    addResult('Auth Check', authUser ? 'success' : 'error', 
      authUser ? `Logged in as: ${authUser.username || authUser.fullName}` : 'Not authenticated');

    // Test 2: Check socket connection
    addResult('Socket Check', socket?.connected ? 'success' : 'error',
      socket?.connected ? `Socket connected: ${socket.id}` : 'Socket not connected');

    // Test 3: Check token
    const token = localStorage.getItem('token');
    addResult('Token Check', token ? 'success' : 'error',
      token ? `Token exists: ${token.substring(0, 20)}...` : 'No token found');

    // Test 4: Test API directly
    try {
      addResult('API Test', 'info', 'Testing direct API call...');
      
      const usersResponse = await axiosInstance.get('/messages/users');
      addResult('Users API', 'success', `Found ${usersResponse.data.length} users`);
      
      if (usersResponse.data.length > 0) {
        const testUser = usersResponse.data[0];
        addResult('Target User', 'success', `Target: ${testUser.username || testUser.nickname} (${testUser.id})`);
        
        // Test message sending via API
        const messageResponse = await axiosInstance.post(`/messages/send/${testUser.id}`, {
          text: `🧪 Diagnostic test message - ${new Date().toISOString()}`
        });
        
        addResult('API Message Send', 'success', `Message sent via API: ${messageResponse.data.id}`);
      }
    } catch (error) {
      addResult('API Test', 'error', `API failed: ${error.message}`);
    }

    // Test 5: Test socket message sending
    if (socket?.connected && selectedUser) {
      try {
        addResult('Socket Test', 'info', 'Testing socket message sending...');
        
        socket.emit('sendMessage', {
          receiverId: selectedUser.id,
          text: `🧪 Socket test message - ${new Date().toISOString()}`,
          tempId: `test-${Date.now()}`
        });
        
        addResult('Socket Message Send', 'success', 'Message sent via socket');
      } catch (error) {
        addResult('Socket Test', 'error', `Socket send failed: ${error.message}`);
      }
    } else {
      addResult('Socket Test', 'error', 'Cannot test socket - not connected or no selected user');
    }

    // Test 6: Test store message sending
    if (selectedUser) {
      try {
        addResult('Store Test', 'info', 'Testing store message sending...');
        
        await sendMessage({
          text: `🧪 Store test message - ${new Date().toISOString()}`
        });
        
        addResult('Store Message Send', 'success', 'Message sent via store');
      } catch (error) {
        addResult('Store Test', 'error', `Store send failed: ${error.message}`);
      }
    } else {
      addResult('Store Test', 'error', 'Cannot test store - no selected user');
    }
  };

  useEffect(() => {
    setDiagnostics({
      authUser: !!authUser,
      socket: !!socket,
      socketConnected: socket?.connected,
      socketId: socket?.id,
      selectedUser: !!selectedUser,
      selectedUserId: selectedUser?.id,
      token: !!localStorage.getItem('token')
    });
  }, [authUser, socket, selectedUser]);

  return (
    <div className="min-h-screen bg-base-200 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-base-100 rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold mb-6">Message Sending Diagnostics</h1>
          
          {/* Current Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-base-200 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Authentication Status</h3>
              <div className={`badge ${diagnostics.authUser ? 'badge-success' : 'badge-error'}`}>
                {diagnostics.authUser ? 'Authenticated' : 'Not Authenticated'}
              </div>
              {authUser && (
                <p className="text-sm mt-1">User: {authUser.username || authUser.fullName}</p>
              )}
            </div>
            
            <div className="bg-base-200 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Socket Status</h3>
              <div className={`badge ${diagnostics.socketConnected ? 'badge-success' : 'badge-error'}`}>
                {diagnostics.socketConnected ? 'Connected' : 'Disconnected'}
              </div>
              {diagnostics.socketId && (
                <p className="text-sm mt-1">ID: {diagnostics.socketId}</p>
              )}
            </div>
            
            <div className="bg-base-200 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Selected User</h3>
              <div className={`badge ${diagnostics.selectedUser ? 'badge-success' : 'badge-warning'}`}>
                {diagnostics.selectedUser ? 'User Selected' : 'No User Selected'}
              </div>
              {selectedUser && (
                <p className="text-sm mt-1">User: {selectedUser.username || selectedUser.fullName}</p>
              )}
            </div>
            
            <div className="bg-base-200 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Token Status</h3>
              <div className={`badge ${diagnostics.token ? 'badge-success' : 'badge-error'}`}>
                {diagnostics.token ? 'Token Present' : 'No Token'}
              </div>
            </div>
          </div>

          {/* Run Diagnostics Button */}
          <div className="mb-6">
            <button 
              onClick={runDiagnostics}
              className="btn btn-primary"
            >
              Run Full Diagnostics
            </button>
          </div>

          {/* Test Results */}
          {testResults.length > 0 && (
            <div className="bg-base-200 p-4 rounded-lg">
              <h3 className="font-semibold mb-4">Test Results</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {testResults.map((result, index) => (
                  <div key={index} className="flex items-center gap-3 p-2 bg-base-100 rounded">
                    <span className="text-xs text-base-content/60">{result.time}</span>
                    <span className="font-medium">{result.test}:</span>
                    <div className={`badge badge-sm ${
                      result.status === 'success' ? 'badge-success' :
                      result.status === 'error' ? 'badge-error' : 'badge-info'
                    }`}>
                      {result.status}
                    </div>
                    <span className="text-sm">{result.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Raw Diagnostics Data */}
          <div className="mt-6 bg-base-200 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Raw Diagnostics Data</h3>
            <pre className="text-xs bg-base-300 p-3 rounded overflow-x-auto">
              {JSON.stringify(diagnostics, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageDiagnosticPage;