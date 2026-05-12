import { prisma } from '../lib/prisma';

export class PackageExpiryService {
  /**
   * Check and expire packages that have passed their expiry date
   */
  static async checkAndExpirePackages(): Promise<void> {
    try {
      const now = new Date();
      
      // Find all user packages that are expired but not yet marked as expired
      const expiredPackages = await prisma.userPackage.findMany({
        where: {
          expiresAt: {
            lte: now,
          },
          remainingSessions: {
            gt: 0, // Only expire packages that still have sessions
          },
        },
        include: {
          package: true,
          user: true,
        },
      });

      // Update expired packages
      for (const userPackage of expiredPackages) {
        await prisma.userPackage.update({
          where: { id: userPackage.id },
          data: {
            remainingSessions: 0, // Set remaining sessions to 0
          },
        });

        console.log(`Expired package ${userPackage.package.name} for user ${userPackage.user.name}`);
      }

      console.log(`Processed ${expiredPackages.length} expired packages`);
    } catch (error) {
      console.error('Error checking package expiry:', error);
      throw error;
    }
  }

  /**
   * Get packages that will expire in the next N days
   */
  static async getExpiringPackages(daysAhead: number = 7): Promise<any[]> {
    try {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + daysAhead);

      const expiringPackages = await prisma.userPackage.findMany({
        where: {
          expiresAt: {
            lte: futureDate,
            gte: new Date(),
          },
          remainingSessions: {
            gt: 0,
          },
        },
        include: {
          package: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
        },
        orderBy: {
          expiresAt: 'asc',
        },
      });

      return expiringPackages;
    } catch (error) {
      console.error('Error fetching expiring packages:', error);
      throw error;
    }
  }

  /**
   * Get user's active packages with expiry information
   */
  static async getUserActivePackages(userId: string): Promise<any[]> {
    try {
      const userPackages = await prisma.userPackage.findMany({
        where: {
          userId,
          remainingSessions: {
            gt: 0,
          },
          OR: [
            { expiresAt: null },
            { expiresAt: { gte: new Date() } },
          ],
        },
        include: {
          package: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      // Add expiry status and days remaining
      return userPackages.map(up => {
        const now = new Date();
        let daysRemaining = null;
        let expiryStatus = 'valid';

        if (up.expiresAt) {
          const expiryDate = new Date(up.expiresAt);
          const timeDiff = expiryDate.getTime() - now.getTime();
          daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));

          if (daysRemaining < 0) {
            expiryStatus = 'expired';
          } else if (daysRemaining <= 3) {
            expiryStatus = 'expiring_soon';
          } else if (daysRemaining <= 7) {
            expiryStatus = 'expiring_week';
          }
        }

        return {
          ...up,
          daysRemaining,
          expiryStatus,
        };
      });
    } catch (error) {
      console.error('Error fetching user active packages:', error);
      throw error;
    }
  }

  /**
   * Extend a package expiry date (admin function)
   */
  static async extendPackageExpiry(
    userPackageId: string,
    additionalDays: number
  ): Promise<any> {
    try {
      const userPackage = await prisma.userPackage.findUnique({
        where: { id: userPackageId },
        include: { package: true },
      });

      if (!userPackage) {
        throw new Error('User package not found');
      }

      let newExpiryDate = new Date();
      
      if (userPackage.expiresAt) {
        newExpiryDate = new Date(userPackage.expiresAt);
      } else {
        // If no expiry date, set it from today
        newExpiryDate = new Date();
      }

      newExpiryDate.setDate(newExpiryDate.getDate() + additionalDays);

      const updatedPackage = await prisma.userPackage.update({
        where: { id: userPackageId },
        data: {
          expiresAt: newExpiryDate,
        },
        include: {
          package: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      return updatedPackage;
    } catch (error) {
      console.error('Error extending package expiry:', error);
      throw error;
    }
  }

  /**
   * Get package expiry statistics
   */
  static async getExpiryStatistics(): Promise<any> {
    try {
      const now = new Date();
      const threeDaysFromNow = new Date(now);
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
      
      const sevenDaysFromNow = new Date(now);
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

      const [
        totalActive,
        expired,
        expiringIn3Days,
        expiringIn7Days,
        neverExpires,
      ] = await Promise.all([
        // Total active packages (with remaining sessions)
        prisma.userPackage.count({
          where: {
            remainingSessions: { gt: 0 },
            OR: [
              { expiresAt: null },
              { expiresAt: { gte: now } },
            ],
          },
        }),
        
        // Expired packages
        prisma.userPackage.count({
          where: {
            remainingSessions: { gt: 0 },
            expiresAt: { lt: now },
          },
        }),
        
        // Expiring in 3 days
        prisma.userPackage.count({
          where: {
            remainingSessions: { gt: 0 },
            expiresAt: {
              gte: now,
              lte: threeDaysFromNow,
            },
          },
        }),
        
        // Expiring in 7 days
        prisma.userPackage.count({
          where: {
            remainingSessions: { gt: 0 },
            expiresAt: {
              gte: now,
              lte: sevenDaysFromNow,
            },
          },
        }),
        
        // Never expire packages
        prisma.userPackage.count({
          where: {
            remainingSessions: { gt: 0 },
            expiresAt: null,
          },
        }),
      ]);

      return {
        totalActive,
        expired,
        expiringIn3Days,
        expiringIn7Days,
        neverExpires,
      };
    } catch (error) {
      console.error('Error fetching expiry statistics:', error);
      throw error;
    }
  }
}
