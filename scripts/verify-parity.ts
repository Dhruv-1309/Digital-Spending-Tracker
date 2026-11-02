#!/usr/bin/env tsx
import { PrismaClient } from '@prisma/client';
import admin from 'firebase-admin';
import { ParityVerifier, type FirestoreUserData } from './migrationEngine.js';

const prisma = new PrismaClient();

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
    transactions,
    categories,
    autopays,
    budgetGoal,
    approvedAnomalies,
  };
}

async function main() {
  const args = process.argv.slice(2);
  const uidIndex = args.indexOf('--uid');
  const targetUid = uidIndex !== -1 ? args[uidIndex + 1] : null;

  console.log(`\n======================================================`);
  console.log(`⚖️ MoneyTracker v3.0 Migration Parity Verification`);
  console.log(`Tolerance: 0 Differences Allowed`);
  if (targetUid) console.log(`Target UID: ${targetUid}`);
  console.log(`======================================================\n`);

  initFirebaseAdmin();
  const db = admin.firestore();
  const verifier = new ParityVerifier(prisma);

  let uids: string[] = [];
  if (targetUid) {
    uids = [targetUid];
  } else {
    console.log('Querying users from Firestore...');
    const snapshot = await db.collection('users').get();
    uids = snapshot.docs.map((doc) => doc.id);
  }

  console.log(`Comparing ${uids.length} user(s) between Firestore and PostgreSQL...\n`);

  const results = [];
  let totalDiscrepancies = 0;

  for (const uid of uids) {
    const userData = await fetchFirestoreUser(db, uid);
    const summary = await verifier.verifyUser(userData);
    results.push(summary);

    if (!summary.matches) {
      totalDiscrepancies += summary.discrepancies.length;
      console.log(`❌ UID ${uid} has discrepancies:`);
      summary.discrepancies.forEach((d) => console.log(`   - ${d}`));
    } else {
      console.log(
        `✅ UID ${uid}: Perfect match (Txs: ${summary.txCountFs}, Autopay: ${summary.autopayCountFs}, Cats: ${summary.categoriesCountFs})`,
      );
    }
  }

  console.log(`\n======================================================`);
  console.log(`📊 Parity Report Summary`);
  console.log(`======================================================`);
  console.table(
    results.map((r) => ({
      UID: r.uid,
      'Tx Count (FS / PG)': `${r.txCountFs} / ${r.txCountPg}`,
      'Income Paise (FS / PG)': `${r.txIncomeSumPaiseFs} / ${r.txIncomeSumPaisePg}`,
      'Expense Paise (FS / PG)': `${r.txExpenseSumPaiseFs} / ${r.txExpenseSumPaisePg}`,
      'Autopay (FS / PG)': `${r.autopayCountFs} / ${r.autopayCountPg}`,
      'Custom Cats (FS / PG)': `${r.categoriesCountFs} / ${r.categoriesCountPg}`,
      Status: r.matches ? 'PASS (0 diff)' : 'FAIL',
    })),
  );

  if (totalDiscrepancies > 0) {
    console.error(`\n❌ PARITY VERIFICATION FAILED: Found ${totalDiscrepancies} discrepancy/discrepancies.`);
    process.exit(1);
  } else {
    console.log(`\n🎉 PARITY VERIFICATION PASSED: 0 differences detected across all users!\n`);
  }
}

if (process.env.NODE_ENV !== 'test') {
  main()
    .catch((err) => {
      console.error('Fatal parity error:', err);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
