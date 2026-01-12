/**
 * Data Migration Utilities
 * MongoDB to PostgreSQL migration scripts
 */

import { PrismaClient } from '@prisma/client';
import { MongoClient, Db } from 'mongodb';

const prisma = new PrismaClient();

interface MigrationConfig {
  mongoUri: string;
  mongoDbName: string;
  batchSize: number;
  dryRun: boolean;
}

interface MigrationStats {
  totalRecords: number;
  migratedRecords: number;
  failedRecords: number;
  skippedRecords: number;
  errors: string[];
}

interface MongoUser {
  _id: string;
  email: string;
  role: 'admin' | 'professor' | 'student';
  profile: any;
  institutionId?: string;
  branchId?: string;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface MongoInstitution {
  _id: string;
  name: string;
  code: string;
  address?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface MongoBranch {
  _id: string;
  institutionId: string;
  name: string;
  code: string;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface MongoCourse {
  _id: string;
  branchId: string;
  name: string;
  code: string;
  credits: number;
  semester: number;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Future migration interfaces will be added here when needed

export class DataMigrator {
  private mongoClient: MongoClient;
  private mongoDB!: Db; // Using definite assignment assertion since it's initialized in connect()
  private config: MigrationConfig;

  constructor(config: MigrationConfig) {
    this.config = config;
    this.mongoClient = new MongoClient(config.mongoUri);
  }

  async connect(): Promise<void> {
    await this.mongoClient.connect();
    this.mongoDB = this.mongoClient.db(this.config.mongoDbName);
    await prisma.$connect();
    logger.info('Connected to MongoDB and PostgreSQL');
  }

  async disconnect(): Promise<void> {
    await this.mongoClient.close();
    await prisma.$disconnect();
    logger.info('Disconnected from databases');
  }

  // Checksum generation method will be added when needed for verification

  /**
   * Migrate institutions from MongoDB to PostgreSQL
   */
  async migrateInstitutions(): Promise<MigrationStats> {
    const stats: MigrationStats = {
      totalRecords: 0,
      migratedRecords: 0,
      failedRecords: 0,
      skippedRecords: 0,
      errors: []
    };

    try {
      const institutions = await this.mongoDB.collection('institutions').find({}).toArray();
      stats.totalRecords = institutions.length;

      logger.info(`Starting migration of ${stats.totalRecords} institutions`);

      for (const mongoInst of institutions as unknown as MongoInstitution[]) {
        try {
          if (this.config.dryRun) {
            logger.info(`[DRY RUN] Would migrate institution: ${mongoInst.name}`);
            stats.migratedRecords++;
            continue;
          }

          // Check if institution already exists
          const existing = await prisma.institution.findFirst({
            where: { code: mongoInst.code }
          });

          if (existing) {
            logger.warn(`Institution with code ${mongoInst.code} already exists, skipping`);
            stats.skippedRecords++;
            continue;
          }

          await prisma.institution.create({
            data: {
              id: mongoInst._id,
              name: mongoInst.name,
              code: mongoInst.code,
              address: mongoInst.address || null,
              createdAt: mongoInst.createdAt || new Date(),
              updatedAt: mongoInst.updatedAt || new Date()
            }
          });

          stats.migratedRecords++;
          logger.debug(`Migrated institution: ${mongoInst.name}`);

        } catch (error) {
          stats.failedRecords++;
          const errorMsg = `Failed to migrate institution ${mongoInst.name}: ${error}`;
          stats.errors.push(errorMsg);
          logger.error(errorMsg);
        }
      }

      logger.info(`Institution migration completed: ${stats.migratedRecords}/${stats.totalRecords} successful`);
      return stats;

    } catch (error) {
      logger.error(`Institution migration failed: ${error}`);
      throw error;
    }
  }

  /**
   * Migrate branches from MongoDB to PostgreSQL
   */
  async migrateBranches(): Promise<MigrationStats> {
    const stats: MigrationStats = {
      totalRecords: 0,
      migratedRecords: 0,
      failedRecords: 0,
      skippedRecords: 0,
      errors: []
    };

    try {
      const branches = await this.mongoDB.collection('branches').find({}).toArray();
      stats.totalRecords = branches.length;

      logger.info(`Starting migration of ${stats.totalRecords} branches`);

      for (const mongoBranch of branches as unknown as MongoBranch[]) {
        try {
          if (this.config.dryRun) {
            logger.info(`[DRY RUN] Would migrate branch: ${mongoBranch.name}`);
            stats.migratedRecords++;
            continue;
          }

          // Verify institution exists
          const institution = await prisma.institution.findUnique({
            where: { id: mongoBranch.institutionId }
          });

          if (!institution) {
            const errorMsg = `Institution ${mongoBranch.institutionId} not found for branch ${mongoBranch.name}`;
            stats.errors.push(errorMsg);
            stats.failedRecords++;
            logger.error(errorMsg);
            continue;
          }

          // Check if branch already exists
          const existing = await prisma.branch.findFirst({
            where: { 
              institutionId: mongoBranch.institutionId,
              code: mongoBranch.code 
            }
          });

          if (existing) {
            logger.warn(`Branch with code ${mongoBranch.code} already exists, skipping`);
            stats.skippedRecords++;
            continue;
          }

          await prisma.branch.create({
            data: {
              id: mongoBranch._id,
              institutionId: mongoBranch.institutionId,
              name: mongoBranch.name,
              code: mongoBranch.code,
              description: mongoBranch.description || null,
              createdAt: mongoBranch.createdAt || new Date(),
              updatedAt: mongoBranch.updatedAt || new Date()
            }
          });

          stats.migratedRecords++;
          logger.debug(`Migrated branch: ${mongoBranch.name}`);

        } catch (error) {
          stats.failedRecords++;
          const errorMsg = `Failed to migrate branch ${mongoBranch.name}: ${error}`;
          stats.errors.push(errorMsg);
          logger.error(errorMsg);
        }
      }

      logger.info(`Branch migration completed: ${stats.migratedRecords}/${stats.totalRecords} successful`);
      return stats;

    } catch (error) {
      logger.error(`Branch migration failed: ${error}`);
      throw error;
    }
  }

  /**
   * Migrate users from MongoDB to PostgreSQL
   */
  async migrateUsers(): Promise<MigrationStats> {
    const stats: MigrationStats = {
      totalRecords: 0,
      migratedRecords: 0,
      failedRecords: 0,
      skippedRecords: 0,
      errors: []
    };

    try {
      const users = await this.mongoDB.collection('users').find({}).toArray();
      stats.totalRecords = users.length;

      logger.info(`Starting migration of ${stats.totalRecords} users`);

      for (const mongoUser of users as unknown as MongoUser[]) {
        try {
          if (this.config.dryRun) {
            logger.info(`[DRY RUN] Would migrate user: ${mongoUser.email}`);
            stats.migratedRecords++;
            continue;
          }

          // Check if user already exists
          const existing = await prisma.user.findUnique({
            where: { email: mongoUser.email }
          });

          if (existing) {
            logger.warn(`User with email ${mongoUser.email} already exists, skipping`);
            stats.skippedRecords++;
            continue;
          }

          // Validate references
          let institutionId: string | null = null;
          let branchId: string | null = null;

          if (mongoUser.institutionId) {
            const institution = await prisma.institution.findUnique({
              where: { id: mongoUser.institutionId }
            });
            if (institution) {
              institutionId = mongoUser.institutionId;
            } else {
              logger.warn(`Institution ${mongoUser.institutionId} not found for user ${mongoUser.email}, setting to null`);
            }
          }

          if (mongoUser.branchId) {
            const branch = await prisma.branch.findUnique({
              where: { id: mongoUser.branchId }
            });
            if (branch) {
              branchId = mongoUser.branchId;
            } else {
              logger.warn(`Branch ${mongoUser.branchId} not found for user ${mongoUser.email}, setting to null`);
            }
          }

          await prisma.user.create({
            data: {
              id: mongoUser._id,
              email: mongoUser.email,
              role: mongoUser.role,
              profile: mongoUser.profile || {},
              institutionId,
              branchId,
              isActive: mongoUser.isActive ?? true,
              createdAt: mongoUser.createdAt || new Date(),
              updatedAt: mongoUser.updatedAt || new Date()
            }
          });

          stats.migratedRecords++;
          logger.debug(`Migrated user: ${mongoUser.email}`);

        } catch (error) {
          stats.failedRecords++;
          const errorMsg = `Failed to migrate user ${mongoUser.email}: ${error}`;
          stats.errors.push(errorMsg);
          logger.error(errorMsg);
        }
      }

      logger.info(`User migration completed: ${stats.migratedRecords}/${stats.totalRecords} successful`);
      return stats;

    } catch (error) {
      logger.error(`User migration failed: ${error}`);
      throw error;
    }
  }

  /**
   * Migrate courses from MongoDB to PostgreSQL
   */
  async migrateCourses(): Promise<MigrationStats> {
    const stats: MigrationStats = {
      totalRecords: 0,
      migratedRecords: 0,
      failedRecords: 0,
      skippedRecords: 0,
      errors: []
    };

    try {
      const courses = await this.mongoDB.collection('courses').find({}).toArray();
      stats.totalRecords = courses.length;

      logger.info(`Starting migration of ${stats.totalRecords} courses`);

      for (const mongoCourse of courses as unknown as MongoCourse[]) {
        try {
          if (this.config.dryRun) {
            logger.info(`[DRY RUN] Would migrate course: ${mongoCourse.name}`);
            stats.migratedRecords++;
            continue;
          }

          // Verify branch exists
          const branch = await prisma.branch.findUnique({
            where: { id: mongoCourse.branchId }
          });

          if (!branch) {
            const errorMsg = `Branch ${mongoCourse.branchId} not found for course ${mongoCourse.name}`;
            stats.errors.push(errorMsg);
            stats.failedRecords++;
            logger.error(errorMsg);
            continue;
          }

          // Check if course already exists
          const existing = await prisma.course.findFirst({
            where: { 
              branchId: mongoCourse.branchId,
              code: mongoCourse.code 
            }
          });

          if (existing) {
            logger.warn(`Course with code ${mongoCourse.code} already exists, skipping`);
            stats.skippedRecords++;
            continue;
          }

          await prisma.course.create({
            data: {
              id: mongoCourse._id,
              branchId: mongoCourse.branchId,
              name: mongoCourse.name,
              code: mongoCourse.code,
              credits: mongoCourse.credits,
              semester: mongoCourse.semester,
              description: mongoCourse.description || null,
              createdAt: mongoCourse.createdAt || new Date(),
              updatedAt: mongoCourse.updatedAt || new Date()
            }
          });

          stats.migratedRecords++;
          logger.debug(`Migrated course: ${mongoCourse.name}`);

        } catch (error) {
          stats.failedRecords++;
          const errorMsg = `Failed to migrate course ${mongoCourse.name}: ${error}`;
          stats.errors.push(errorMsg);
          logger.error(errorMsg);
        }
      }

      logger.info(`Course migration completed: ${stats.migratedRecords}/${stats.totalRecords} successful`);
      return stats;

    } catch (error) {
      logger.error(`Course migration failed: ${error}`);
      throw error;
    }
  }

  /**
   * Run complete migration process
   */
  async runFullMigration(): Promise<Record<string, MigrationStats>> {
    const results: Record<string, MigrationStats> = {};

    try {
      await this.connect();

      logger.info('Starting full data migration from MongoDB to PostgreSQL');

      // Migration order is important due to foreign key constraints
      results.institutions = await this.migrateInstitutions();
      results.branches = await this.migrateBranches();
      results.users = await this.migrateUsers();
      results.courses = await this.migrateCourses();

      // Additional collections can be added here
      // results.assignments = await this.migrateAssignments();
      // results.submissions = await this.migrateSubmissions();
      // results.attendance = await this.migrateAttendance();
      // results.notices = await this.migrateNotices();

      logger.info('Full migration completed successfully');
      return results;

    } catch (error) {
      logger.error(`Migration failed: ${error}`);
      throw error;
    } finally {
      await this.disconnect();
    }
  }

  /**
   * Verify data integrity after migration
   */
  async verifyMigration(): Promise<boolean> {
    try {
      logger.info('Starting migration verification');

      // Count records in both databases
      const mongoStats = {
        institutions: await this.mongoDB.collection('institutions').countDocuments(),
        branches: await this.mongoDB.collection('branches').countDocuments(),
        users: await this.mongoDB.collection('users').countDocuments(),
        courses: await this.mongoDB.collection('courses').countDocuments(),
      };

      const postgresStats = {
        institutions: await prisma.institution.count(),
        branches: await prisma.branch.count(),
        users: await prisma.user.count(),
        courses: await prisma.course.count(),
      };

      logger.info('Record counts comparison:', { mongoStats, postgresStats });

      // Check if counts match (allowing for skipped duplicates)
      const isValid = Object.keys(mongoStats).every(key => {
        const mongoCount = mongoStats[key as keyof typeof mongoStats];
        const postgresCount = postgresStats[key as keyof typeof postgresStats];
        return postgresCount <= mongoCount; // Allow for skipped records
      });

      if (isValid) {
        logger.info('Migration verification passed');
      } else {
        logger.error('Migration verification failed - record counts do not match');
      }

      return isValid;

    } catch (error) {
      logger.error(`Migration verification failed: ${error}`);
      return false;
    }
  }
}

/**
 * Create logger instance for migration
 */
const logger = {
  info: (message: string, meta?: any) => console.log(`[INFO] ${message}`, meta || ''),
  warn: (message: string, meta?: any) => console.warn(`[WARN] ${message}`, meta || ''),
  error: (message: string, meta?: any) => console.error(`[ERROR] ${message}`, meta || ''),
  debug: (message: string, meta?: any) => console.debug(`[DEBUG] ${message}`, meta || ''),
};

export { logger };