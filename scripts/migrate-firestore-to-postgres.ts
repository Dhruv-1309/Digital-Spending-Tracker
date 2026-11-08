#!/usr/bin/env tsx
import { PrismaClient } from '@prisma/client';
import admin from 'firebase-admin';
import { MigrationEngine, type FirestoreUserData } from './migrationEngine.js';

// Initialize Prisma
const prisma = new PrismaClient();

// Initialize Firebase Admin (ADC, service account file, or project ID)
function initFirebaseAdmin() {
  if (admin.apps.length === 0) {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      try {
        const cred = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
        admin.initializeApp({
          credential: admin.credential.cert(cred),
        });
        return;
      } catch {
        // Fallback
      }
    }
    const projectId = process.env.FIREBASE_PROJECT_ID || 'money-spending-tracker';
    admin.initializeApp({ projectId });
  }
}

async function fetchFirestoreUser(db: admin.firestore.Firestore, uid: string): Promise<FirestoreUserData> {
  const userRef = db.collection('users').doc(uid);
  const dataRef = userRef.collection('data');

  const [txSnap, catSnap, autoSnap, budgetSnap, anomSnap, userSnap] = await Promise.all([
    dataRef.doc('transactions').get().catch(() => null),
    dataRef.doc('categories').get().catch(() => null),
    dataRef.doc('autopays').get().catch(() => null),
    dataRef.doc('budgetGoal').get().catch(() => null),
    dataRef.doc('anomalies').get().catch(() => null),
    userRef.get().catch(() => null),
  ]);

  const userDoc = userSnap?.data() || {};
  const transactions = txSnap?.data()?.items || [];
  const categories = catSnap?.data()?.items || { income: [], expense: [] };
  const autopays = autoSnap?.data()?.items || [];
  const budgetGoal = budgetSnap?.data() || { monthlyExpenseLimit: 0, thresholdPercent: 80 };
  const approvedAnomalies = anomSnap?.data()?.items || [];

  return {
    uid,
    email: userDoc.email || null,
    displayName: userDoc.displayName || null,
    authMethod: userDoc.authMethod || 'password',
    timezone: userDoc.timezone || 'Asia/Kolkata',
    transactions,
    categories,
    autopays,
    budgetGoal,
    approvedAnomalies,
  };
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const uidIndex = args.indexOf('--uid');
  const targetUid = uidIndex !== -1 ? args[uidIndex + 1] : null;

  console.log(`\n======================================================`);
  console.log(`🚀 MoneyTracker v3.0 Firestore -> PostgreSQL Migration`);
  console.log(`Mode: ${dryRun ? '🔍 DRY RUN (no writes to PostgreSQL)' : '💾 LIVE MIGRATION'}`);
  if (targetUid) console.log(`Target UID: ${targetUid}`);
  console.log(`======================================================\n`);

  initFirebaseAdmin();
  const db = admin.firestore();
  const engine = new MigrationEngine(prisma);

  let uids: string[] = [];
  if (targetUid) {
    uids = [targetUid];
  } else {
    console.log('Fetching all users from Firestore...');
    const snapshot = await db.collection('users').get();
    uids = snapshot.docs.map((doc) => doc.id);
  }

  console.log(`Found ${uids.length} user(s) to process.\n`);

  const startTime = Date.now();
  let totalTx = 0;
  let totalCats = 0;
  let totalAutopays = 0;
  let totalPaise = 0n;
  const errors: Array<{ uid: string; error: string }> = [];

  for (const uid of uids) {
    try {
      console.log(`Processing UID: ${uid}...`);
      const userData = await fetchFirestoreUser(db, uid);
      const res = await engine.migrateUser(userData, { dryRun });

      totalTx += res.transactionsCount;
      totalCats += res.categoriesCount;
      totalAutopays += res.autopaysCount;
      totalPaise += res.totalIncomePaise + res.totalExpensePaise;

      console.log(
        `  ✓ User: ${res.userId} | Txs: ${res.transactionsCount} | Categories: ${res.categoriesCount} | Autopays: ${res.autopaysCount} | Volume: ₹${Number(totalPaise) / 100}`,
      );
    } catch (err: any) {
      console.error(`  ✗ Error migrating UID ${uid}:`, err.message);
      errors.push({ uid, error: err.message });
    }
  }

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`\n======================================================`);
  console.log(`🎉 Migration Completed in ${durationSec}s`);
  console.log(`Total Users Processed:   ${uids.length}`);
  console.log(`Total Transactions:      ${totalTx}`);
  console.log(`Total Custom Categories: ${totalCats}`);
  console.log(`Total Autopay Plans:     ${totalAutopays}`);
  console.log(`Total Value Migrated:    ₹${Number(totalPaise) / 100}`);
  console.log(`Errors Encountered:      ${errors.length}`);
  console.log(`======================================================\n`);

  if (errors.length > 0) {
    console.error('Migration finished with errors. Review the logs above.');
    process.exit(1);
  }
}

if (process.env.NODE_ENV !== 'test') {
  main()
    .catch((err) => {
      console.error('Fatal migration error:', err);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
