import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Thermal Printer Service');
  });

  it('/printer/configuration/options does not expose driver command bytes', async () => {
    const response = await request(app.getHttpServer())
      .get('/printer/configuration/options')
      .expect(200);

    const body: unknown = response.body;
    if (!isRecord(body)) {
      throw new TypeError('Configuration catalog response must be an object.');
    }

    expect(Array.isArray(body.settings)).toBe(true);
    expect(Array.isArray(body.actions)).toBe(true);
    expect(JSON.stringify(body)).not.toContain('rawBytes');
  });

  afterEach(async () => {
    await app.close();
  });
});

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
