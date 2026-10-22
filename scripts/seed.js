import { seedDatabase } from '../src/shared/seedRunner.js';

async function main() {
  try {
    console.log('--- Pulmo Care Database Seeder ---');
    await seedDatabase(console.log);
    console.log('All collections initialized in Firestore.');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

main();
