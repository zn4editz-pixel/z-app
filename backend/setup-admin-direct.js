import bcrypt from 'bcryptjs';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

async function setupAdminDirect() {
    try {
        console.log('🔧 Setting up admin user directly in SQLite...\n');
        
        // Open SQLite database
        const db = await open({
            filename: './dev.db',
            driver: sqlite3.Database
        });
        
        // Admin details
        const adminEmail = 'z4fwan77@gmail.com';
        const adminPassword = 'admin123';
        const adminUsername = 'admin';
        const hashedPassword = await bcrypt.hash(adminPassword, 10);
        
        console.log(`📧 Admin Email: ${adminEmail}`);
        console.log(`👤 Admin Username: ${adminUsername}`);
        console.log(`🔑 Admin Password: ${adminPassword}`);
        
        // Check if admin exists
        const existingAdmin = await db.get(
            'SELECT * FROM User WHERE email = ? OR username = ?',
            [adminEmail, adminUsername]
        );
        
        if (existingAdmin) {
            console.log('\n👤 Admin user exists, updating password...');
            
            // Update existing admin
            await db.run(
                `UPDATE User SET 
                    password = ?, 
                    hasCompletedProfile = 1, 
                    isVerified = 1,
                    updatedAt = datetime('now')
                WHERE email = ?`,
                [hashedPassword, adminEmail]
            );
            
            console.log('✅ Admin password updated');
        } else {
            console.log('\n👤 Creating new admin user...');
            
            // Generate unique ID
            const adminId = 'admin_' + Date.now();
            
            // Create new admin user
            await db.run(
                `INSERT INTO User (
                    id, email, username, fullName, nickname, password,
                    hasCompletedProfile, isVerified, bio, country,
                    createdAt, updatedAt
                ) VALUES (?, ?, ?, ?, ?, ?, 1, 1, ?, ?, datetime('now'), datetime('now'))`,
                [
                    adminId,
                    adminEmail,
                    adminUsername,
                    'System Administrator',
                    'Admin',
                    hashedPassword,
                    'System Administrator',
                    'System'
                ]
            );
            
            console.log('✅ Admin user created successfully!');
        }
        
        // Verify the admin user
        const adminUser = await db.get('SELECT * FROM User WHERE email = ?', [adminEmail]);
        
        if (adminUser) {
            console.log('\n✅ Admin user verified in database:');
            console.log(`   ID: ${adminUser.id}`);
            console.log(`   Email: ${adminUser.email}`);
            console.log(`   Username: ${adminUser.username}`);
            console.log(`   Profile Complete: ${adminUser.hasCompletedProfile ? 'Yes' : 'No'}`);
            console.log(`   Verified: ${adminUser.isVerified ? 'Yes' : 'No'}`);
            
            // Test password
            const isPasswordValid = await bcrypt.compare(adminPassword, adminUser.password);
            console.log(`   Password Valid: ${isPasswordValid ? '✅ Yes' : '❌ No'}`);
        }
        
        await db.close();
        
        console.log('\n🎯 ADMIN ACCESS READY!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📧 Email:', adminEmail);
        console.log('🔑 Password:', adminPassword);
        console.log('🌐 Login URL: http://localhost:5173/login');
        console.log('👑 Admin Panel: http://localhost:5173/admin');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
    } catch (error) {
        console.error('❌ Error setting up admin:', error);
    }
}

setupAdminDirect();