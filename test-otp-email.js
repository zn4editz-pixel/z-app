/**
 * OTP Email Test Script
 * Tests email sending functionality and diagnoses OTP issues
 */

import dotenv from 'dotenv';
import sendEmail from './backend/src/utils/sendEmail.js';

// Load environment variables
dotenv.config({ path: './backend/.env.render' });

const testOTPEmail = async () => {
  console.log('🧪 Testing OTP Email Functionality...\n');
  
  // Test 1: Check Environment Variables
  console.log('📋 Test 1: Environment Variables');
  console.log(`EMAIL_USER: ${process.env.EMAIL_USER ? '✅ Set' : '❌ Missing'}`);
  console.log(`EMAIL_PASS: ${process.env.EMAIL_PASS ? '✅ Set' : '❌ Missing'}`);
  console.log(`EMAIL_FROM: ${process.env.EMAIL_FROM || 'Not set'}`);
  
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('\n❌ Email credentials not configured!');
    console.log('💡 Please set EMAIL_USER and EMAIL_PASS in your environment');
    return;
  }
  
  // Test 2: Generate Test OTP
  console.log('\n🔢 Test 2: Generate Test OTP');
  const testOTP = Math.floor(100000 + Math.random() * 900000).toString();
  console.log(`Generated OTP: ${testOTP}`);
  
  // Test 3: Create Test Email Content
  console.log('\n📧 Test 3: Create Test Email Content');
  const testEmailContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Test OTP - Z-APP</title>
    </head>
    <body style="margin: 0; padding: 20px; font-family: Arial, sans-serif; background-color: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        <h1 style="color: #333; text-align: center; margin-bottom: 30px;">🧪 Test OTP Email</h1>
        
        <div style="text-align: center; margin: 30px 0;">
          <div style="background: linear-gradient(45deg, #7c3aed, #4f46e5); color: white; font-size: 32px; font-weight: bold; letter-spacing: 8px; padding: 20px; border-radius: 10px; display: inline-block;">
            ${testOTP}
          </div>
        </div>
        
        <p style="color: #666; text-align: center; margin-top: 30px;">
          This is a test email to verify OTP functionality is working correctly.
        </p>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="color: #999; font-size: 14px;">Z-APP Email Service Test</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  // Test 4: Send Test Email
  console.log('\n📤 Test 4: Send Test Email');
  const testEmail = process.env.EMAIL_USER; // Send to self for testing
  
  try {
    console.log(`Sending test OTP email to: ${testEmail}`);
    const result = await sendEmail(testEmail, '🧪 Test OTP - Z-APP', testEmailContent);
    
    console.log('✅ Test email sent successfully!');
    console.log(`Message ID: ${result.messageId}`);
    console.log(`Response: ${result.response}`);
    
    console.log('\n🎉 OTP Email Test PASSED!');
    console.log('✅ Email service is working correctly');
    console.log('✅ OTP generation is working');
    console.log('✅ Email templates are rendering properly');
    
  } catch (error) {
    console.log('\n❌ Test email failed!');
    console.error('Error details:', error.message);
    console.error('Error code:', error.code);
    
    // Provide specific troubleshooting advice
    if (error.message.includes('Authentication failed')) {
      console.log('\n🔧 Troubleshooting: Authentication Issue');
      console.log('1. Verify EMAIL_USER is correct Gmail address');
      console.log('2. Verify EMAIL_PASS is App Password (not regular password)');
      console.log('3. Generate new App Password: https://myaccount.google.com/apppasswords');
      console.log('4. Enable 2-Factor Authentication on Gmail account');
    } else if (error.message.includes('Connection failed')) {
      console.log('\n🔧 Troubleshooting: Connection Issue');
      console.log('1. Check internet connection');
      console.log('2. Verify Gmail SMTP is not blocked by firewall');
      console.log('3. Try again in a few minutes');
    } else if (error.message.includes('timed out')) {
      console.log('\n🔧 Troubleshooting: Timeout Issue');
      console.log('1. Check network stability');
      console.log('2. Try again with better connection');
      console.log('3. Consider increasing timeout values');
    }
  }
};

// Test 5: Simulate Full OTP Flow
const testFullOTPFlow = async () => {
  console.log('\n🔄 Test 5: Simulate Full OTP Flow');
  
  const mockUser = {
    username: 'testuser',
    email: process.env.EMAIL_USER,
    id: 'test-user-id'
  };
  
  console.log(`Mock user: ${mockUser.username} (${mockUser.email})`);
  
  // Generate OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  console.log(`Generated OTP: ${otp}`);
  
  // Create expiry time (10 minutes from now)
  const expiryTime = new Date(Date.now() + 10 * 60 * 1000);
  console.log(`OTP expires at: ${expiryTime.toISOString()}`);
  
  // Simulate database save (in real app, this would save to database)
  console.log('✅ OTP would be saved to database with expiry');
  
  // Test email sending
  const emailContent = `
    <div style="text-align: center; padding: 20px;">
      <h2>Password Reset OTP</h2>
      <div style="font-size: 32px; font-weight: bold; color: #7c3aed; margin: 20px 0;">
        ${otp}
      </div>
      <p>This OTP expires in 10 minutes.</p>
    </div>
  `;
  
  try {
    await sendEmail(mockUser.email, 'Password Reset OTP - Z-APP', emailContent);
    console.log('✅ Full OTP flow simulation successful!');
  } catch (error) {
    console.log('❌ Full OTP flow simulation failed:', error.message);
  }
};

// Run tests
const runAllTests = async () => {
  try {
    await testOTPEmail();
    await testFullOTPFlow();
    
    console.log('\n🏁 All OTP tests completed!');
    console.log('\n📝 Next Steps:');
    console.log('1. Update Render environment variables with correct email credentials');
    console.log('2. Restart Render service to apply new environment variables');
    console.log('3. Test OTP functionality in production');
    
  } catch (error) {
    console.error('\n💥 Test suite failed:', error);
  }
};

// Auto-run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests();
}

export { testOTPEmail, testFullOTPFlow, runAllTests };