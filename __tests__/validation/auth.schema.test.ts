import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
} from '../../src/validation/auth.schema';

describe('auth.schema validation', () => {
  describe('loginSchema', () => {
    test('loginSchema valid email and 6-char password passes validation', () => {
      const result = loginSchema.safeParse({
        email: 'student@walletly.com',
        password: 'password123',
      });
      expect(result.success).toBe(true);
    });

    test('loginSchema boundary password length 6 passes validation', () => {
      const result = loginSchema.safeParse({
        email: 'user@test.org',
        password: '123456',
      });
      expect(result.success).toBe(true);
    });

    test('loginSchema boundary password length 5 fails validation with min length error', () => {
      const result = loginSchema.safeParse({
        email: 'user@test.org',
        password: '12345',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Password must be at least 6 characters');
      }
    });

    test('loginSchema empty email fails validation with email required error', () => {
      const result = loginSchema.safeParse({
        email: '',
        password: 'password123',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Email is required');
      }
    });

    test('loginSchema invalid email format fails validation with invalid email format error', () => {
      const result = loginSchema.safeParse({
        email: 'not-an-email',
        password: 'password123',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Invalid email format');
      }
    });

    test('loginSchema missing fields fails validation on both email and password', () => {
      const result = loginSchema.safeParse({});
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.length).toBeGreaterThanOrEqual(2);
      }
    });

    test('loginSchema null input fails validation', () => {
      const result = loginSchema.safeParse(null);
      expect(result.success).toBe(false);
    });
  });

  describe('registerSchema', () => {
    test('registerSchema valid inputs passes validation', () => {
      const result = registerSchema.safeParse({
        email: 'newuser@walletly.com',
        password: 'securePassword!',
      });
      expect(result.success).toBe(true);
    });

    test('registerSchema empty email fails validation', () => {
      const result = registerSchema.safeParse({
        email: '',
        password: 'securePassword!',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Email is required');
      }
    });

    test('registerSchema short password fails validation', () => {
      const result = registerSchema.safeParse({
        email: 'newuser@walletly.com',
        password: 'abc',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Password must be at least 6 characters');
      }
    });

    test('registerSchema invalid email fails validation', () => {
      const result = registerSchema.safeParse({
        email: 'bademail@',
        password: 'securePassword!',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('forgotPasswordSchema', () => {
    test('forgotPasswordSchema valid email passes validation', () => {
      const result = forgotPasswordSchema.safeParse({
        email: 'recover@walletly.com',
      });
      expect(result.success).toBe(true);
    });

    test('forgotPasswordSchema empty email fails validation', () => {
      const result = forgotPasswordSchema.safeParse({
        email: '',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Email is required');
      }
    });

    test('forgotPasswordSchema invalid email format fails validation', () => {
      const result = forgotPasswordSchema.safeParse({
        email: 'not-an-email',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Invalid email format');
      }
    });

    test('forgotPasswordSchema undefined input fails validation', () => {
      const result = forgotPasswordSchema.safeParse(undefined);
      expect(result.success).toBe(false);
    });
  });
});
