import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://psmdpjokjhjfhzesaret.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzbWRwam9ramhmamh6YXNhcmV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0ODEyNzgsImV4cCI6MjA4MTA1NzI3OH0.ozEecDWueKpyJ_9n78B6f3-OjRa0hiL1DGQgnSjzh1g';

async function testConnection() {
  try {
    console.log('🔄 Testing Supabase connection...');
    console.log('URL:', supabaseUrl);
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Test basic connection
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ Connection failed:', error);
      console.log('💡 This might mean:');
      console.log('   1. Schema not applied yet');
      console.log('   2. Network connectivity issue');
      console.log('   3. Supabase project not ready');
    } else {
      console.log('✅ Supabase connection successful!');
      console.log('📊 Database is ready for use');
    }
  } catch (err) {
    console.error('❌ Connection test failed:', err.message);
    console.log('💡 Please check:');
    console.log('   1. Internet connection');
    console.log('   2. Supabase project URL');
    console.log('   3. Database schema applied');
  }
}

testConnection();