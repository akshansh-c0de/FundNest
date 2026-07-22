import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { generate } from 'otplib';
import User from './models/userModel.js';
import Session from './models/sessionModel.js';

const PORT = process.env.PORT || 8000;
const BASE_URL = `http://localhost:${PORT}/api/users`;

// Helper to extract cookie from response headers
const getCookie = (resHeaders, cookieName) => {
    const setCookieHeaders = resHeaders.getSetCookie ? resHeaders.getSetCookie() : [];
    for (const header of setCookieHeaders) {
        if (header.startsWith(`${cookieName}=`)) {
            return header.split(';')[0].split('=')[1];
        }
    }
    return null;
};

async function runTests() {
    console.log('=== STARTING FUNDNEST API INTEGRATION TESTS ===\n');

    // 1. Database Connection Check
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB successfully.\n');
    } catch (err) {
        console.error('\n❌ DATABASE CONNECTION FAILED!');
        console.error(`Reason: ${err.message}`);
        console.error('\n💡 To run this test, please ensure:');
        console.error('  1. Your current IP address is whitelisted on your MongoDB Atlas Cluster.');
        console.error('  2. Or, change MONGO_URI in .env to a local MongoDB instance (e.g. mongodb://localhost:27017/fundnest).\n');
        process.exit(1);
    }

    const testEmail = `test_investor_${Date.now()}@example.com`;
    const testPassword = 'Password123!';
    const testName = 'Test Investor';

    let accessToken = '';
    let refreshTokenCookie = '';
    let temp2faSecret = '';

    try {
        // --- TEST 1: Register User ---
        console.log(`[Test 1] Registering user: ${testEmail}...`);
        const registerRes = await fetch(`${BASE_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: testName, email: testEmail, password: testPassword, role: 'investor' })
        });
        const registerData = await registerRes.json();
        
        if (!registerRes.ok) throw new Error(registerData.message);
        console.log('✅ Registration successful. Message:', registerData.message);

        // --- TEST 2: Email Verification (Database token check + verification call) ---
        console.log('\n[Test 2] Querying database for email verification token...');
        const user = await User.findOne({ email: testEmail });
        if (!user || !user.emailVerificationToken) {
            throw new Error('Verification token not found in database.');
        }
        console.log(`Found Token: ${user.emailVerificationToken}`);

        console.log('Verifying email via endpoint...');
        const verifyRes = await fetch(`${BASE_URL}/verify-email?token=${user.emailVerificationToken}`);
        const verifyData = await verifyRes.json();
        if (!verifyRes.ok) throw new Error(verifyData.message);
        console.log('✅ Email verified. Message:', verifyData.message);

        // --- TEST 3: Login User (Without 2FA first) ---
        console.log('\n[Test 3] Logging in...');
        const loginRes = await fetch(`${BASE_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: testEmail, password: testPassword })
        });
        const loginData = await loginRes.json();
        if (!loginRes.ok) throw new Error(loginData.message);

        accessToken = loginData.accessToken;
        refreshTokenCookie = getCookie(loginRes.headers, 'refreshToken');

        console.log('✅ Login successful!');
        console.log(`Access Token: ${accessToken.substring(0, 15)}...`);
        console.log(`Refresh Token (Cookie): ${refreshTokenCookie ? refreshTokenCookie.substring(0, 15) : 'MISSING'}...`);

        // --- TEST 4: Get Profile (Authenticated) ---
        console.log('\n[Test 4] Fetching profile (requires Access Token)...');
        const profileRes = await fetch(`${BASE_URL}/profile`, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        const profileData = await profileRes.json();
        if (!profileRes.ok) throw new Error(profileData.message);
        console.log('✅ Profile retrieved successfully! User Name:', profileData.user.name);

        // --- TEST 5: Initiate 2FA Enablement ---
        console.log('\n[Test 5] Initiating 2FA setup...');
        const enable2faRes = await fetch(`${BASE_URL}/enable-2fa`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        const enable2faData = await enable2faRes.json();
        if (!enable2faRes.ok) throw new Error(enable2faData.message);
        temp2faSecret = enable2faData.secret;
        console.log('✅ 2FA setup initiated.');
        console.log(`Secret: ${temp2faSecret}`);
        console.log(`QR Code Data URI: ${enable2faData.qrCodeUri.substring(0, 30)}...`);

        // --- TEST 6: Confirm 2FA with Code ---
        console.log('\n[Test 6] Confirming 2FA with generated TOTP token...');
        const totpCode = await generate({ secret: temp2faSecret });
        console.log(`Generated TOTP: ${totpCode}`);

        const confirmRes = await fetch(`${BASE_URL}/confirm-2fa`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify({ code: totpCode })
        });
        const confirmData = await confirmRes.json();
        if (!confirmRes.ok) throw new Error(confirmData.message);
        console.log('✅ 2FA confirmed successfully!');
        console.log('Recovery Codes:', confirmData.recoveryCodes);

        // --- TEST 7: Login Again (With 2FA requirement) ---
        console.log('\n[Test 7] Logging in again (2FA enabled)...');
        const login2faRes = await fetch(`${BASE_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: testEmail, password: testPassword })
        });
        const login2faData = await login2faRes.json();
        if (!login2faRes.ok) throw new Error(login2faData.message);
        
        if (!login2faData.require2FA) {
            throw new Error('Expected 2FA redirection but logged in directly.');
        }
        console.log('✅ Redirection flag "require2FA" returned successfully.');
        const tempToken = login2faData.tempToken;
        console.log(`Temporary Session Token: ${tempToken.substring(0, 15)}...`);

        // --- TEST 8: Verify 2FA Login ---
        console.log('\n[Test 8] Verifying 2FA login token...');
        const nextTotpCode = await generate({ secret: temp2faSecret });
        const verify2faRes = await fetch(`${BASE_URL}/verify-2fa-login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tempToken, code: nextTotpCode })
        });
        const verify2faData = await verify2faRes.json();
        if (!verify2faRes.ok) throw new Error(verify2faData.message);

        // Extract new tokens
        accessToken = verify2faData.accessToken;
        refreshTokenCookie = getCookie(verify2faRes.headers, 'refreshToken');
        console.log('✅ 2FA login successful!');
        console.log(`New Access Token: ${accessToken.substring(0, 15)}...`);

        // --- TEST 9: View Active Sessions ---
        console.log('\n[Test 9] Fetching active sessions...');
        const sessionsRes = await fetch(`${BASE_URL}/sessions`, {
            headers: { 
                'Authorization': `Bearer ${accessToken}`,
                'Cookie': `refreshToken=${refreshTokenCookie}`
            }
        });
        const sessionsData = await sessionsRes.json();
        if (!sessionsRes.ok) throw new Error(sessionsData.message);
        console.log('✅ Active sessions list:');
        sessionsData.sessions.forEach(s => {
            console.log(` - Browser: ${s.browser} | Device: ${s.device} | IP: ${s.ipAddress} | Current: ${s.isCurrent}`);
        });

        // --- TEST 10: Refresh Token Rotation ---
        console.log('\n[Test 10] Testing Refresh Token Rotation (RTR)...');
        const refreshRes = await fetch(`${BASE_URL}/refresh-token`, {
            method: 'POST',
            headers: { 'Cookie': `refreshToken=${refreshTokenCookie}` }
        });
        const refreshData = await refreshRes.json();
        if (!refreshRes.ok) throw new Error(refreshData.message);

        accessToken = refreshData.accessToken;
        const newRefreshTokenCookie = getCookie(refreshRes.headers, 'refreshToken');
        console.log('✅ Token Rotated!');
        console.log(`New Access Token: ${accessToken.substring(0, 15)}...`);
        console.log(`New Refresh Token Cookie: ${newRefreshTokenCookie ? newRefreshTokenCookie.substring(0, 15) : 'MISSING'}...`);

        // Update refresh token
        refreshTokenCookie = newRefreshTokenCookie;

        // --- TEST 11: Revoke all sessions (Logout) ---
        console.log('\n[Test 11] Logging out from all devices...');
        const logoutRes = await fetch(`${BASE_URL}/logout-all`, {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${accessToken}`,
                'Cookie': `refreshToken=${refreshTokenCookie}`
            }
        });
        const logoutData = await logoutRes.json();
        if (!logoutRes.ok) throw new Error(logoutData.message);
        console.log('✅ Revoked all sessions. Logout message:', logoutData.message);

        // --- CLEAN UP: Remove Test User ---
        console.log('\nCleaning up database (deleting test user)...');
        await User.deleteOne({ email: testEmail });
        await Session.deleteMany({ userId: user._id });
        console.log('Database cleaned up.');

        console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY! The authentication, security, and session systems are fully operational.');

    } catch (error) {
        console.error(`\n❌ TEST FAILURE: ${error.message}`);
        // Attempt database cleanup of the user if created
        try {
            await User.deleteOne({ email: testEmail });
        } catch (cleanupErr) {}
    } finally {
        await mongoose.disconnect();
        console.log('\nDisconnected from MongoDB. Exiting test.');
        process.exit(0);
    }
}

runTests();
