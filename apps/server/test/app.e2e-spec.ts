import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { ResponseInterceptor } from '../src/common/interceptors/response.interceptor';
import { MailService } from '../src/modules/mail/mail.service';
import { UploadService } from '../src/modules/upload/upload.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { FakePrismaService } from './support/fake-prisma.service';

describe('Auth and Onboarding (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: FakePrismaService;
  let uploadService: {
    uploadProfileImage: jest.Mock;
    deleteProfileImage: jest.Mock;
  };

  async function createApp() {
    process.env.JWT_ACCESS_SECRET = 'test-jwt-secret';
    process.env.JWT_ACCESS_EXPIRES_IN = '15m';
    process.env.OTP_HASH_SECRET = 'test-otp-secret';
    process.env.RESEND_API_KEY = 're_test';
    process.env.MAIL_FROM = 'Soplantila <no-reply@example.com>';
    process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
    process.env.AUTH_EXPOSE_OTP_IN_RESPONSE = 'true';
    process.env.UPLOAD_DRIVER = 'local';
    process.env.UPLOAD_MAX_FILE_SIZE = '2097152';

    prisma = new FakePrismaService();
    uploadService = {
      uploadProfileImage: jest
        .fn()
        .mockImplementation(async (file?: Express.Multer.File) =>
          file ? `https://cdn.test/profile-images/${Date.now()}-${file.originalname}` : null,
        ),
      deleteProfileImage: jest.fn().mockResolvedValue(undefined),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .overrideProvider(MailService)
      .useValue({
        sendEmailVerificationOtp: jest.fn().mockResolvedValue(undefined),
      })
      .overrideProvider(UploadService)
      .useValue(uploadService)
      .compile();

    const nestApp = moduleFixture.createNestApplication();
    nestApp.setGlobalPrefix('api');
    nestApp.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    nestApp.useGlobalInterceptors(new ResponseInterceptor());
    nestApp.useGlobalFilters(new HttpExceptionFilter());
    await nestApp.init();

    return nestApp;
  }

  beforeEach(async () => {
    app = await createApp();
  });

  afterEach(async () => {
    await app.close();
  });

  it('completes register -> verify OTP -> onboarding flow with frontend-ready response contract', async () => {
    const email = `qa.e2e.${Date.now()}@example.com`;
    const password = 'StrongP@ssw0rd!';

    const registerResponse = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email, password, confirmPassword: password })
      .expect(201);

    expect(registerResponse.body.success).toBe(true);
    expect(registerResponse.body.data.email).toBe(email);
    expect(registerResponse.body.data.status).toBe('PENDING_VERIFICATION');
    expect(registerResponse.body.data.otpPreview).toHaveLength(6);

    const verifyResponse = await request(app.getHttpServer())
      .post('/api/auth/verify-otp')
      .send({ email, otpCode: registerResponse.body.data.otpPreview })
      .expect(201);

    expect(verifyResponse.body.data.accessToken).toEqual(expect.any(String));
    expect(verifyResponse.body.data.user.status).toBe('ONBOARDING_IN_PROGRESS');
    expect(verifyResponse.body.data.nextStep).toBe('COMPLETE_ONBOARDING');

    const onboardingResponse = await request(app.getHttpServer())
      .post('/api/onboarding/profile')
      .set('Authorization', `Bearer ${verifyResponse.body.data.accessToken}`)
      .field('firstName', 'Samuel')
      .field('lastName', 'Frontend')
      .field('username', `samuel${Date.now().toString().slice(-6)}`)
      .field('tanggalLahir', '2000-04-03')
      .field('tempatLahir', 'Jakarta')
      .field('gender', 'MALE')
      .field('pekerjaan', 'Engineer')
      .field('bio', 'Ready for frontend integration.')
      .attach('fotoProfil', Buffer.from('fake-image'), {
        filename: 'avatar.png',
        contentType: 'image/png',
      })
      .expect(201);

    expect(onboardingResponse.body.data.user.status).toBe('ACTIVE');
    expect(onboardingResponse.body.data.user.onboardingCompleted).toBe(true);
    expect(onboardingResponse.body.data.user.profile.fotoProfilUrl).toContain(
      'https://cdn.test/profile-images/',
    );
    expect(onboardingResponse.body.data.nextStep).toBe('DASHBOARD');

    const meResponse = await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${verifyResponse.body.data.accessToken}`)
      .expect(200);

    expect(meResponse.body.data.status).toBe('ACTIVE');
    expect(meResponse.body.data.nextStep).toBe('DASHBOARD');
    expect(meResponse.body.data.profile.username).toBe(
      onboardingResponse.body.data.user.profile.username,
    );
  });

  it('rejects reserved usernames and supports profile update plus avatar delete', async () => {
    const activeUser = prisma.seedActiveUser();
    const accessToken = await new JwtService({
      secret: process.env.JWT_ACCESS_SECRET,
      signOptions: { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN as never },
    }).signAsync({
      sub: activeUser.id,
      email: activeUser.email,
      status: activeUser.status,
    });

    const reservedResponse = await request(app.getHttpServer())
      .patch('/api/onboarding/profile')
      .set('Authorization', `Bearer ${accessToken}`)
      .field('username', 'admin')
      .expect(400);

    expect(reservedResponse.body.error.message).toBe('Username is not allowed.');

    const updateResponse = await request(app.getHttpServer())
      .patch('/api/onboarding/profile')
      .set('Authorization', `Bearer ${accessToken}`)
      .field('bio', 'Updated profile bio')
      .attach('fotoProfil', Buffer.from('new-fake-image'), {
        filename: 'updated-avatar.png',
        contentType: 'image/png',
      })
      .expect(200);

    expect(updateResponse.body.data.user.profile.bio).toBe('Updated profile bio');
    expect(updateResponse.body.data.user.profile.fotoProfilUrl).toContain('updated-avatar.png');
    expect(uploadService.deleteProfileImage).toHaveBeenCalledWith(
      'https://cdn.example.com/profile-images/old.png',
    );

    const deleteResponse = await request(app.getHttpServer())
      .delete('/api/onboarding/profile-image')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(deleteResponse.body.data.profileImageDeleted).toBe(true);
    expect(deleteResponse.body.data.profile.fotoProfilUrl).toBeNull();
  });

  it('throttles repeated register attempts', async () => {
    const statuses: number[] = [];

    for (let index = 0; index < 6; index += 1) {
      const response = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: `throttle.${Date.now()}.${index}@example.com`,
          password: 'StrongP@ssw0rd!',
          confirmPassword: 'StrongP@ssw0rd!',
        });

      statuses.push(response.status);
    }

    expect(statuses).toEqual([201, 201, 201, 201, 201, 429]);
  });
});
