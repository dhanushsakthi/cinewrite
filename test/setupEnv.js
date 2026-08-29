// Points tests at a dedicated test database so they never touch dev data.
// Override via a real .env.test file if your local credentials differ.
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL
  || 'postgres://cinewrite:cinewrite_dev_pw@localhost:5432/cinewrite_test';
process.env.JWT_SECRET = 'test_secret_do_not_use_in_prod';
process.env.JWT_EXPIRES_IN = '1h';
