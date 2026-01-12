#!/usr/bin/env tsx

/**
 * Data Migration CLI Script
 * Migrates data from MongoDB to PostgreSQL
 */

import { program } from 'commander';
import { config } from 'dotenv';
import { DataMigrator } from '../utils/migration';

// Load environment variables
config();

interface CliOptions {
  mongoUri?: string;
  mongoDb?: string;
  batchSize?: string;
  dryRun?: boolean;
  verify?: boolean;
  collections?: string;
}

async function main() {
  program
    .name('migrate-data')
    .description('Migrate data from MongoDB to PostgreSQL')
    .version('1.0.0');

  program
    .option('-m, --mongo-uri <uri>', 'MongoDB connection URI', process.env.MONGO_URI)
    .option('-d, --mongo-db <name>', 'MongoDB database name', process.env.MONGO_DB_NAME || 'mbcdb')
    .option('-b, --batch-size <size>', 'Batch size for migration', '100')
    .option('--dry-run', 'Run migration in dry-run mode (no actual data changes)', false)
    .option('--verify', 'Verify migration integrity after completion', false)
    .option('-c, --collections <list>', 'Comma-separated list of collections to migrate (default: all)')
    .action(async (options: CliOptions) => {
      try {
        if (!options.mongoUri) {
          console.error('Error: MongoDB URI is required. Use --mongo-uri or set MONGO_URI environment variable.');
          process.exit(1);
        }

        const migrator = new DataMigrator({
          mongoUri: options.mongoUri,
          mongoDbName: options.mongoDb || 'mbcdb',
          batchSize: parseInt(options.batchSize || '100'),
          dryRun: options.dryRun || false
        });

        console.log('🚀 Starting MBC Data Migration');
        console.log(`📊 Configuration:`);
        console.log(`   MongoDB URI: ${options.mongoUri}`);
        console.log(`   MongoDB DB: ${options.mongoDb}`);
        console.log(`   Batch Size: ${options.batchSize}`);
        console.log(`   Dry Run: ${options.dryRun ? 'Yes' : 'No'}`);
        console.log(`   Verify: ${options.verify ? 'Yes' : 'No'}`);
        console.log('');

        const startTime = Date.now();

        // Run migration
        const results = await migrator.runFullMigration();

        // Display results
        console.log('📈 Migration Results:');
        console.log('='.repeat(50));
        
        let totalMigrated = 0;
        let totalFailed = 0;
        let totalSkipped = 0;

        Object.entries(results).forEach(([collection, stats]) => {
          console.log(`${collection.toUpperCase()}:`);
          console.log(`  ✅ Migrated: ${stats.migratedRecords}/${stats.totalRecords}`);
          console.log(`  ⚠️  Skipped: ${stats.skippedRecords}`);
          console.log(`  ❌ Failed: ${stats.failedRecords}`);
          
          if (stats.errors.length > 0) {
            console.log(`  🔍 Errors:`);
            stats.errors.slice(0, 5).forEach(error => {
              console.log(`     - ${error}`);
            });
            if (stats.errors.length > 5) {
              console.log(`     ... and ${stats.errors.length - 5} more errors`);
            }
          }
          console.log('');

          totalMigrated += stats.migratedRecords;
          totalFailed += stats.failedRecords;
          totalSkipped += stats.skippedRecords;
        });

        console.log('📊 Summary:');
        console.log(`   Total Migrated: ${totalMigrated}`);
        console.log(`   Total Skipped: ${totalSkipped}`);
        console.log(`   Total Failed: ${totalFailed}`);
        console.log(`   Duration: ${((Date.now() - startTime) / 1000).toFixed(2)}s`);

        // Verify migration if requested
        if (options.verify) {
          console.log('\n🔍 Verifying migration integrity...');
          const isValid = await migrator.verifyMigration();
          
          if (isValid) {
            console.log('✅ Migration verification passed!');
          } else {
            console.log('❌ Migration verification failed!');
            process.exit(1);
          }
        }

        console.log('\n🎉 Migration completed successfully!');

        if (options.dryRun) {
          console.log('\n⚠️  This was a dry run. No actual data was migrated.');
          console.log('   Remove --dry-run flag to perform actual migration.');
        }

      } catch (error) {
        console.error('💥 Migration failed:', error);
        process.exit(1);
      }
    });

  // Add individual collection migration commands
  program
    .command('institutions')
    .description('Migrate only institutions')
    .option('-m, --mongo-uri <uri>', 'MongoDB connection URI', process.env.MONGO_URI)
    .option('-d, --mongo-db <name>', 'MongoDB database name', process.env.MONGO_DB_NAME || 'mbcdb')
    .option('--dry-run', 'Run migration in dry-run mode', false)
    .action(async (options: CliOptions) => {
      try {
        if (!options.mongoUri) {
          console.error('Error: MongoDB URI is required.');
          process.exit(1);
        }

        const migrator = new DataMigrator({
          mongoUri: options.mongoUri,
          mongoDbName: options.mongoDb || 'mbcdb',
          batchSize: 100,
          dryRun: options.dryRun || false
        });

        await migrator.connect();
        const stats = await migrator.migrateInstitutions();
        await migrator.disconnect();

        console.log('Institution migration completed:', stats);
      } catch (error) {
        console.error('Institution migration failed:', error);
        process.exit(1);
      }
    });

  program
    .command('verify')
    .description('Verify migration integrity')
    .option('-m, --mongo-uri <uri>', 'MongoDB connection URI', process.env.MONGO_URI)
    .option('-d, --mongo-db <name>', 'MongoDB database name', process.env.MONGO_DB_NAME || 'mbcdb')
    .action(async (options: CliOptions) => {
      try {
        if (!options.mongoUri) {
          console.error('Error: MongoDB URI is required.');
          process.exit(1);
        }

        const migrator = new DataMigrator({
          mongoUri: options.mongoUri,
          mongoDbName: options.mongoDb || 'mbcdb',
          batchSize: 100,
          dryRun: false
        });

        await migrator.connect();
        const isValid = await migrator.verifyMigration();
        await migrator.disconnect();

        if (isValid) {
          console.log('✅ Migration verification passed!');
        } else {
          console.log('❌ Migration verification failed!');
          process.exit(1);
        }
      } catch (error) {
        console.error('Verification failed:', error);
        process.exit(1);
      }
    });

  await program.parseAsync();
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

if (require.main === module) {
  main().catch(console.error);
}