import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = 'https://psmdpjokjhjfhzesaret.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzbWRwam9ramhmamh6YXNhcmV0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTQ4MTI3OCwiZXhwIjoyMDgxMDU3Mjc4fQ.-0l0By6iGA7du29Qvy-a2rNB1lRbP0un_1CwZsKhmok';
const supabase = createClient(supabaseUrl, supabaseKey);

async function importToSupabase() {
  try {
    console.log('🆓 Importing data to FREE Supabase...');

    if (!fs.existsSync('supabase-export.json')) {
      console.error('❌ Export file not found');
      return;
    }

    const data = JSON.parse(fs.readFileSync('supabase-export.json', 'utf8'));

    // Import users to FREE Supabase
    console.log(`📊 Importing ${data.users.length} users...`);
    if (data.users.length > 0) {
      const { error: usersError } = await supabase
        .from('users')
        .insert(data.users);
      if (usersError) console.error('Users import error:', usersError);
      else console.log('✅ Users imported successfully');
    }

    // Import messages to FREE Supabase
    console.log(`📊 Importing ${data.messages.length} messages...`);
    if (data.messages.length > 0) {
      const { error: messagesError } = await supabase
        .from('messages')
        .insert(data.messages);
      if (messagesError) console.error('Messages import error:', messagesError);
      else console.log('✅ Messages imported successfully');
    }

    // Import other data if exists
    if (data.friendRequests && data.friendRequests.length > 0) {
      console.log(`📊 Importing ${data.friendRequests.length} friend requests...`);
      const { error: frError } = await supabase
        .from('friend_requests')
        .insert(data.friendRequests);
      if (frError) console.error('Friend requests import error:', frError);
      else console.log('✅ Friend requests imported successfully');
    }

    if (data.friends && data.friends.length > 0) {
      console.log(`📊 Importing ${data.friends.length} friends...`);
      const { error: friendsError } = await supabase
        .from('friends')
        .insert(data.friends);
      if (friendsError) console.error('Friends import error:', friendsError);
      else console.log('✅ Friends imported successfully');
    }

    if (data.reports && data.reports.length > 0) {
      console.log(`📊 Importing ${data.reports.length} reports...`);
      const { error: reportsError } = await supabase
        .from('reports')
        .insert(data.reports);
      if (reportsError) console.error('Reports import error:', reportsError);
      else console.log('✅ Reports imported successfully');
    }

    console.log('✅ FREE Supabase import complete!');
  } catch (error) {
    console.error('❌ Import failed:', error);
  }
}

importToSupabase();