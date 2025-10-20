/**
 * Test script to verify email sending works correctly
 * Run with: node test-email-fix.js <your-email>
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { sendVerificationEmail } from './lib/email.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env.local') });

async function testEmail() {
  const testEmail = process.argv[2];
  
  if (!testEmail) {
    console.error('Usage: node test-email-fix.js <test-email>');
    process.exit(1);
  }
  
  console.log('\n=== Testing Email Configuration ===');
  console.log('Target email:', testEmail);
  console.log('\nEnvironment variables:');
  console.log('- GOOGLE_OAUTH_CLIENT_ID:', !!process.env.GOOGLE_OAUTH_CLIENT_ID ? '✓ Set' : '✗ Missing');
  console.log('- GOOGLE_OAUTH_CLIENT_SECRET:', !!process.env.GOOGLE_OAUTH_CLIENT_SECRET ? '✓ Set' : '✗ Missing');
  console.log('- GOOGLE_OAUTH_REFRESH_TOKEN:', !!process.env.GOOGLE_OAUTH_REFRESH_TOKEN ? '✓ Set' : '✗ Missing');
  console.log('- GMAIL_SENDER_EMAIL:', process.env.GMAIL_SENDER_EMAIL || '✗ Missing');
  console.log('- GOOGLE_CLIENT_EMAIL:', !!process.env.GOOGLE_CLIENT_EMAIL ? '✓ Set' : '✗ Missing');
  console.log('- RESEND_API_KEY:', !!process.env.RESEND_API_KEY ? '✓ Set' : '✗ Missing');
  console.log('- PUBLIC_BASE_URL:', process.env.PUBLIC_BASE_URL || '✗ Missing');
  console.log('- NODE_ENV:', process.env.NODE_ENV || 'development');
  
  const testUrl = `${process.env.PUBLIC_BASE_URL || 'http://localhost:5173'}/verified?token=TEST123`;
  
  console.log('\n=== Attempting to send test email ===\n');
  
  try {
    const result = await sendVerificationEmail({
      to: testEmail,
      verifyUrl: testUrl,
      appName: 'COMET (Test)'
    });
    
    console.log('\n=== Test Result ===');
    console.log('Success:', result);
    
    if (result.mocked) {
      console.log('\n⚠️  WARNING: Email was MOCKED (not actually sent)');
      console.log('This means no email provider is properly configured.');
      console.log('In production, this will now throw an error.');
    } else {
      console.log('\n✓ Email sent successfully!');
      console.log('Check your inbox at:', testEmail);
    }
    
  } catch (error) {
    console.log('\n=== Test Failed ===');
    console.error('Error:', error.message);
    console.error('\nThis is the error that will now appear in Vercel logs.');
    console.error('Fix: Ensure all required environment variables are set correctly.');
    process.exit(1);
  }
}

testEmail().catch(err => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
