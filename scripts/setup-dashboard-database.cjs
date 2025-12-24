#!/usr/bin/env node
/**
 * 3A Dashboard Database Setup Script
 * Initializes Google Sheets database and creates admin user
 * Date: 2025-12-24
 */

const bcrypt = require('bcryptjs');

// Configuration
const ADMIN_EMAIL = 'admin@3a-automation.com';
const ADMIN_PASSWORD = 'Admin2025!@#'; // Change this after first login
const ADMIN_NAME = 'Admin 3A';

const GOOGLE_SHEETS_API_URL = 'https://script.google.com/macros/s/AKfycbzFP751mwK04FguPrIISQlMHHUULw5-e-n_Pn63h-SXEBOUvD-wpM7wmbGDPauGdzIZ/exec';

async function generatePasswordHash(password) {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
}

async function createAdminUser() {
  console.log('\n📊 3A DASHBOARD DATABASE SETUP');
  console.log('================================\n');

  // Generate password hash
  console.log('🔐 Generating bcrypt password hash...');
  const passwordHash = await generatePasswordHash(ADMIN_PASSWORD);
  console.log('✅ Password hash generated\n');

  // User data to insert in Google Sheets
  const adminUser = {
    id: 'user_admin_001',
    email: ADMIN_EMAIL,
    name: ADMIN_NAME,
    password: passwordHash,
    role: 'ADMIN',
    createdAt: new Date().toISOString(),
    lastLogin: ''
  };

  console.log('📋 ADMIN USER DATA FOR GOOGLE SHEETS:');
  console.log('=====================================\n');
  console.log('Copy this row to the "Users" sheet:\n');

  // Headers
  console.log('| id | email | name | password | role | createdAt | lastLogin |');
  console.log('|' + '-'.repeat(80) + '|');

  // Values
  console.log(`| ${adminUser.id} | ${adminUser.email} | ${adminUser.name} | ${adminUser.password} | ${adminUser.role} | ${adminUser.createdAt} | |`);

  console.log('\n\n📝 TAB-SEPARATED VALUES (for paste into Sheets):');
  console.log('='.repeat(60) + '\n');
  const row = [
    adminUser.id,
    adminUser.email,
    adminUser.name,
    adminUser.password,
    adminUser.role,
    adminUser.createdAt,
    ''
  ].join('\t');
  console.log(row);

  console.log('\n\n🔑 LOGIN CREDENTIALS:');
  console.log('='.repeat(40));
  console.log(`Email:    ${ADMIN_EMAIL}`);
  console.log(`Password: ${ADMIN_PASSWORD}`);
  console.log(`URL:      https://dashboard.3a-automation.com/login`);

  console.log('\n\n📌 MANUAL STEPS REQUIRED:');
  console.log('='.repeat(40));
  console.log('1. Open Google Sheets: https://docs.google.com/spreadsheets/d/1OPJmd6lBxhnBfmX5F2nDkDEPjykGjCbC6UAQHV6Fy8w/edit');
  console.log('2. Go to the "Users" sheet (create it if needed)');
  console.log('3. Add headers in row 1: id, email, name, password, role, createdAt, lastLogin');
  console.log('4. Paste the tab-separated values above in row 2');
  console.log('5. Test login at https://dashboard.3a-automation.com/login\n');
}

async function testApiConnection() {
  console.log('🔌 Testing Google Sheets API connection...');
  try {
    const response = await fetch(GOOGLE_SHEETS_API_URL);
    const data = await response.json();
    if (data.status === 'ok') {
      console.log('✅ API connection successful:', data.message);
      return true;
    }
  } catch (error) {
    console.log('❌ API connection failed:', error.message);
  }
  return false;
}

async function main() {
  await testApiConnection();
  await createAdminUser();

  console.log('\n📊 REQUIRED SHEETS STRUCTURE:');
  console.log('='.repeat(40));
  console.log('\n1. Users: id, email, name, password, role, createdAt, lastLogin');
  console.log('2. Leads: id, name, email, phone, company, jobTitle, linkedinUrl, source, status, score, priority, notes, tags, assignedTo, createdAt, updatedAt, lastContact, nextFollowUp');
  console.log('3. Automations: id, name, description, type, status, n8nWorkflowId, schedule, lastRunAt, nextRunAt, runCount, successCount, errorCount, ownerId, createdAt');
  console.log('4. Activities: id, userId, leadId, action, details, createdAt');
  console.log('5. Metrics: id, name, value, unit, category, date');

  console.log('\n\n⚠️  IMPORTANT: Run initializeSheets() in Google Apps Script Editor');
  console.log('    to automatically create all sheets with headers!\n');
}

main().catch(console.error);
