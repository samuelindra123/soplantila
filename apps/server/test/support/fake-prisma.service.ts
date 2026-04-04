import {
  Gender,
  OtpPurpose,
  OtpStatus,
  Prisma,
  UserStatus,
  type OnboardingProfile,
  type User,
} from '@prisma/client';

type EmailOtpRecord = {
  id: string;
  userId: string;
  purpose: OtpPurpose;
  codeHash: string;
  expiresAt: Date;
  lastSentAt: Date;
  resendCount: number;
  attemptCount: number;
  verifiedAt: Date | null;
  status: OtpStatus;
  createdAt: Date;
  updatedAt: Date;
};

export class FakePrismaService {
  private userCounter = 1;
  private otpCounter = 1;
  private profileCounter = 1;

  private readonly users: User[] = [];
  private readonly emailOtps: EmailOtpRecord[] = [];
  private readonly profiles: OnboardingProfile[] = [];

  readonly user = {
    findUnique: async (args: {
      where: { email?: string; id?: string };
      include?: { profile?: boolean };
    }) => {
      const user =
        args.where.email != null
          ? this.users.find((entry) => entry.email === args.where.email) ?? null
          : this.users.find((entry) => entry.id === args.where.id) ?? null;

      return this.attachProfile(user, args.include?.profile === true);
    },

    findUniqueOrThrow: async (args: {
      where: { id: string };
      include?: { profile?: boolean };
    }) => {
      const user = this.users.find((entry) => entry.id === args.where.id);

      if (!user) {
        throw new Error('Record not found');
      }

      return this.attachProfile(user, args.include?.profile === true);
    },

    create: async (args: { data: Prisma.UserCreateInput }) => {
      if (this.users.some((entry) => entry.email === args.data.email)) {
        throw this.uniqueError();
      }

      const now = new Date();
      const user: User = {
        id: `user_${this.userCounter++}`,
        email: args.data.email,
        passwordHash: args.data.passwordHash,
        emailVerifiedAt: args.data.emailVerifiedAt ?? null,
        status: args.data.status ?? UserStatus.PENDING_VERIFICATION,
        onboardingCompleted: args.data.onboardingCompleted ?? false,
        lastLoginAt: args.data.lastLoginAt ?? null,
        createdAt: now,
        updatedAt: now,
      };

      this.users.push(user);

      return { ...user };
    },

    update: async (args: {
      where: { id: string };
      data: Record<string, unknown>;
      include?: { profile?: boolean };
    }) => {
      const user = this.users.find((entry) => entry.id === args.where.id);

      if (!user) {
        throw new Error('Record not found');
      }

      Object.assign(user, args.data, { updatedAt: new Date() });

      return this.attachProfile(user, args.include?.profile === true);
    },
  };

  readonly emailOtp = {
    updateMany: async (args: {
      where: {
        userId?: string;
        purpose?: OtpPurpose;
        status?: OtpStatus;
        expiresAt?: { lt: Date };
      };
      data: Partial<EmailOtpRecord>;
    }) => {
      let count = 0;

      for (const otp of this.emailOtps) {
        if (!this.matchesOtp(otp, args.where)) {
          continue;
        }

        Object.assign(otp, args.data, { updatedAt: new Date() });
        count += 1;
      }

      return { count };
    },

    create: async (args: {
      data: {
        userId: string;
        purpose: OtpPurpose;
        codeHash: string;
        expiresAt: Date;
        lastSentAt: Date;
      };
    }) => {
      const now = new Date();
      const otp: EmailOtpRecord = {
        id: `otp_${this.otpCounter++}`,
        userId: args.data.userId,
        purpose: args.data.purpose,
        codeHash: args.data.codeHash,
        expiresAt: args.data.expiresAt,
        lastSentAt: args.data.lastSentAt,
        resendCount: 0,
        attemptCount: 0,
        verifiedAt: null,
        status: OtpStatus.PENDING,
        createdAt: now,
        updatedAt: now,
      };

      this.emailOtps.push(otp);

      return { ...otp };
    },

    findFirst: async (args: {
      where: {
        userId?: string;
        purpose?: OtpPurpose;
        status?: OtpStatus;
      };
      orderBy?: { createdAt: 'asc' | 'desc' };
    }) => {
      const records = this.emailOtps
        .filter((otp) => this.matchesOtp(otp, args.where))
        .sort((left, right) =>
          args.orderBy?.createdAt === 'asc'
            ? left.createdAt.getTime() - right.createdAt.getTime()
            : right.createdAt.getTime() - left.createdAt.getTime(),
        );

      return records[0] ? { ...records[0] } : null;
    },

    update: async (args: {
      where: { id: string };
      data: Record<string, unknown>;
    }) => {
      const otp = this.emailOtps.find((entry) => entry.id === args.where.id);

      if (!otp) {
        throw new Error('Record not found');
      }

      const resendCount = this.resolveCounter(otp.resendCount, args.data.resendCount);
      const attemptCount = this.resolveCounter(otp.attemptCount, args.data.attemptCount);

      Object.assign(otp, args.data, {
        resendCount,
        attemptCount,
        updatedAt: new Date(),
      });

      return { ...otp };
    },

    deleteMany: async (args: {
      where: {
        OR?: Array<{ status: OtpStatus }>;
        updatedAt?: { lt: Date };
      };
    }) => {
      const matching = this.emailOtps.filter((otp) => {
        const statusMatches =
          args.where.OR == null ||
          args.where.OR.some((condition) => otp.status === condition.status);
        const updatedMatches =
          args.where.updatedAt == null || otp.updatedAt < args.where.updatedAt.lt;

        return statusMatches && updatedMatches;
      });

      for (const otp of matching) {
        const index = this.emailOtps.findIndex((entry) => entry.id === otp.id);
        if (index !== -1) {
          this.emailOtps.splice(index, 1);
        }
      }

      return { count: matching.length };
    },
  };

  readonly onboardingProfile = {
    findUnique: async (args: {
      where: { username?: string; userId?: string };
      select?: { userId?: boolean };
    }) => {
      const profile =
        args.where.username != null
          ? this.profiles.find((entry) => entry.username === args.where.username) ?? null
          : this.profiles.find((entry) => entry.userId === args.where.userId) ?? null;

      if (!profile) {
        return null;
      }

      if (args.select?.userId) {
        return { userId: profile.userId };
      }

      return { ...profile };
    },

    upsert: async (args: {
      where: { userId: string };
      update: Record<string, unknown>;
      create: Record<string, unknown>;
    }) => {
      const current = this.profiles.find((entry) => entry.userId === args.where.userId);

      if (current) {
        if (args.update.username != null) {
          this.assertUniqueUsername(String(args.update.username), args.where.userId);
        }

        Object.assign(current, args.update, { updatedAt: new Date() });
        return { ...current };
      }

      this.assertUniqueUsername(String(args.create.username), args.where.userId);

      const now = new Date();
      const created: OnboardingProfile = {
        id: `profile_${this.profileCounter++}`,
        userId: String(args.create.userId),
        firstName: String(args.create.firstName),
        lastName: String(args.create.lastName),
        username: String(args.create.username),
        tanggalLahir: args.create.tanggalLahir as Date,
        tempatLahir: String(args.create.tempatLahir),
        gender: (args.create.gender as Gender) ?? Gender.PREFER_NOT_TO_SAY,
        pekerjaan: (args.create.pekerjaan as string | null | undefined) ?? null,
        fotoProfilUrl: (args.create.fotoProfilUrl as string | null | undefined) ?? null,
        bio: (args.create.bio as string | null | undefined) ?? null,
        createdAt: now,
        updatedAt: now,
      };

      this.profiles.push(created);

      return { ...created };
    },

    update: async (args: {
      where: { userId: string };
      data: Record<string, unknown>;
    }) => {
      const profile = this.profiles.find((entry) => entry.userId === args.where.userId);

      if (!profile) {
        throw new Error('Record not found');
      }

      if (args.data.username != null) {
        this.assertUniqueUsername(String(args.data.username), args.where.userId);
      }

      Object.assign(profile, args.data, { updatedAt: new Date() });

      return { ...profile };
    },
  };

  async $transaction<T>(callback: (tx: FakePrismaService) => Promise<T>): Promise<T> {
    return callback(this);
  }

  seedActiveUser() {
    const now = new Date();
    const user: User = {
      id: `user_${this.userCounter++}`,
      email: 'active@example.com',
      passwordHash: 'hashed',
      emailVerifiedAt: now,
      status: UserStatus.ACTIVE,
      onboardingCompleted: true,
      lastLoginAt: null,
      createdAt: now,
      updatedAt: now,
    };

    const profile: OnboardingProfile = {
      id: `profile_${this.profileCounter++}`,
      userId: user.id,
      firstName: 'Active',
      lastName: 'User',
      username: 'activeuser',
      tanggalLahir: new Date('2000-01-01T00:00:00.000Z'),
      tempatLahir: 'Jakarta',
      gender: Gender.MALE,
      pekerjaan: 'Engineer',
      fotoProfilUrl: 'https://cdn.example.com/profile-images/old.png',
      bio: 'Original bio',
      createdAt: now,
      updatedAt: now,
    };

    this.users.push(user);
    this.profiles.push(profile);

    return { ...user, profile };
  }

  private attachProfile(user: User | null, includeProfile: boolean) {
    if (!user) {
      return null;
    }

    if (!includeProfile) {
      return { ...user };
    }

    return {
      ...user,
      profile: this.profiles.find((entry) => entry.userId === user.id) ?? null,
    };
  }

  private matchesOtp(
    otp: EmailOtpRecord,
    where: {
      userId?: string;
      purpose?: OtpPurpose;
      status?: OtpStatus;
      expiresAt?: { lt: Date };
    },
  ) {
    return (
      (where.userId == null || otp.userId === where.userId) &&
      (where.purpose == null || otp.purpose === where.purpose) &&
      (where.status == null || otp.status === where.status) &&
      (where.expiresAt == null || otp.expiresAt < where.expiresAt.lt)
    );
  }

  private resolveCounter(
    current: number,
    value: unknown,
  ): number {
    if (
      typeof value === 'object' &&
      value !== null &&
      'increment' in (value as Record<string, unknown>)
    ) {
      return current + Number((value as { increment: number }).increment);
    }

    return typeof value === 'number' ? value : current;
  }

  private assertUniqueUsername(username: string, userId: string) {
    const existing = this.profiles.find((entry) => entry.username === username);

    if (existing && existing.userId !== userId) {
      throw this.uniqueError();
    }
  }

  private uniqueError(): Prisma.PrismaClientKnownRequestError {
    return new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
      code: 'P2002',
      clientVersion: 'fake',
    });
  }
}
