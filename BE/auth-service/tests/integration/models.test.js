const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

// Valid bcrypt hash (60 characters) - used for all tests
const VALID_BCRYPT_HASH = '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS8sxvQMT5qlS';

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('User Model', () => {
  const User = require('../../src/models/User');

  beforeEach(async () => {
    // Clear collections but preserve indexes
    await User.deleteMany({});
    // Ensure indexes are created
    await User.ensureIndexes();
  });

  describe('User Schema Creation', () => {
    it('should create a user with valid email and passwordHash', async () => {
      const user = new User({
        email: 'test@example.com',
        passwordHash: VALID_BCRYPT_HASH
      });
      const savedUser = await user.save();

      expect(savedUser._id).toBeDefined();
      expect(savedUser.email).toBe('test@example.com');
      expect(savedUser.passwordHash).toBe(VALID_BCRYPT_HASH);
      expect(savedUser.role).toBe('User');
      expect(savedUser.isActive).toBe(true);
    });

    it('should have createdAt and updatedAt timestamps', async () => {
      const user = new User({
        email: 'test@example.com',
        passwordHash: VALID_BCRYPT_HASH
      });
      const savedUser = await user.save();

      expect(savedUser.createdAt).toBeInstanceOf(Date);
      expect(savedUser.updatedAt).toBeInstanceOf(Date);
    });

    it('should have lastLoginAt defaulting to null', async () => {
      const user = new User({
        email: 'test@example.com',
        passwordHash: VALID_BCRYPT_HASH
      });
      const savedUser = await user.save();

      expect(savedUser.lastLoginAt).toBeNull();
    });

    it('should require email field', async () => {
      const user = new User({
        passwordHash: VALID_BCRYPT_HASH
      });

      await expect(user.save()).rejects.toThrow(/email/i);
    });

    it('should require passwordHash field', async () => {
      const user = new User({
        email: 'test@example.com'
      });

      await expect(user.save()).rejects.toThrow(/passwordHash/i);
    });
  });

  describe('Email Validation', () => {
    it('should accept valid email formats', async () => {
      const validEmails = [
        'user@example.com',
        'john.doe@company.co.uk',
        'test+tag@domain.com'
      ];

      for (const email of validEmails) {
        const user = new User({
          email,
          passwordHash: VALID_BCRYPT_HASH
        });
        const savedUser = await user.save();
        expect(savedUser.email).toBe(email.toLowerCase());
      }
    });

    it('should reject invalid email formats', async () => {
      const invalidEmails = [
        'invalid',
        'invalid@',
        '@invalid.com',
        'invalid @example.com',
        'invalid@.com'
      ];

      for (const email of invalidEmails) {
        const user = new User({
          email,
          passwordHash: VALID_BCRYPT_HASH
        });

        await expect(user.save()).rejects.toThrow(/invalid email format/i);
      }
    });

    it('should convert email to lowercase before saving', async () => {
      const user = new User({
        email: 'TEST@EXAMPLE.COM',
        passwordHash: VALID_BCRYPT_HASH
      });
      const savedUser = await user.save();

      expect(savedUser.email).toBe('test@example.com');
    });

    it('should trim whitespace from email', async () => {
      const user = new User({
        email: '  test@example.com  ',
        passwordHash: VALID_BCRYPT_HASH
      });
      const savedUser = await user.save();

      expect(savedUser.email).toBe('test@example.com');
    });

    it('should reject null email', async () => {
      const user = new User({
        email: null,
        passwordHash: VALID_BCRYPT_HASH
      });

      await expect(user.save()).rejects.toThrow(/email/i);
    });

    it('should reject numeric email value', async () => {
      const user = new User({
        email: 12345,
        passwordHash: VALID_BCRYPT_HASH
      });

      await expect(user.save()).rejects.toThrow(/invalid email format/i);
    });

    it('should reject empty string email', async () => {
      const user = new User({
        email: '',
        passwordHash: VALID_BCRYPT_HASH
      });

      await expect(user.save()).rejects.toThrow(/email/i);
    });
  });

  describe('Email Uniqueness', () => {
    it('should enforce unique email constraint', async () => {
      const email = 'unique@example.com';

      const user1 = new User({ email, passwordHash: VALID_BCRYPT_HASH });
      await user1.save();

      const user2 = new User({ email, passwordHash: VALID_BCRYPT_HASH });

      await expect(user2.save()).rejects.toThrow(/duplicate|unique|index/i);
    });

    it('should enforce uniqueness after email lowercasing (case-insensitive)', async () => {
      const user1 = new User({ email: 'test@example.com', passwordHash: VALID_BCRYPT_HASH });
      await user1.save();

      const user2 = new User({ email: 'TEST@EXAMPLE.COM', passwordHash: VALID_BCRYPT_HASH });

      await expect(user2.save()).rejects.toThrow(/duplicate|unique|index/i);
    });
  });

  describe('Role Enum Validation', () => {
    it('should accept User role', async () => {
      const user = new User({
        email: 'test@example.com',
        passwordHash: VALID_BCRYPT_HASH,
        role: 'User'
      });
      const savedUser = await user.save();

      expect(savedUser.role).toBe('User');
    });

    it('should accept Admin role', async () => {
      const user = new User({
        email: 'admin@example.com',
        passwordHash: VALID_BCRYPT_HASH,
        role: 'Admin'
      });
      const savedUser = await user.save();

      expect(savedUser.role).toBe('Admin');
    });

    it('should default to User role when not specified', async () => {
      const user = new User({
        email: 'test@example.com',
        passwordHash: VALID_BCRYPT_HASH
      });
      const savedUser = await user.save();

      expect(savedUser.role).toBe('User');
    });

    it('should reject invalid role values', async () => {
      const user = new User({
        email: 'test@example.com',
        passwordHash: VALID_BCRYPT_HASH,
        role: 'SuperAdmin'
      });

      await expect(user.save()).rejects.toThrow(/enum|either/i);
    });

    it('should reject lowercase role value', async () => {
      const user = new User({
        email: 'test@example.com',
        passwordHash: VALID_BCRYPT_HASH,
        role: 'user'
      });

      await expect(user.save()).rejects.toThrow(/enum|either/i);
    });

    it('should reject null role value', async () => {
      const user = new User({
        email: 'test@example.com',
        passwordHash: VALID_BCRYPT_HASH,
        role: null
      });

      await expect(user.save()).rejects.toThrow(/required|enum|either/i);
    });

    it('should reject numeric role value', async () => {
      const user = new User({
        email: 'test@example.com',
        passwordHash: VALID_BCRYPT_HASH,
        role: 123
      });

      await expect(user.save()).rejects.toThrow(/enum|either/i);
    });
  });

  describe('Timestamps Auto-generation', () => {
    it('should update updatedAt when user is modified', async () => {
      const user = new User({
        email: 'test@example.com',
        passwordHash: VALID_BCRYPT_HASH
      });
      const savedUser = await user.save();
      const originalUpdatedAt = savedUser.updatedAt;

      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 100));

      savedUser.role = 'Admin';
      const updatedUser = await savedUser.save();

      expect(updatedUser.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });

    it('should not change createdAt when user is modified', async () => {
      const user = new User({
        email: 'test@example.com',
        passwordHash: VALID_BCRYPT_HASH
      });
      const savedUser = await user.save();
      const originalCreatedAt = savedUser.createdAt;

      await new Promise(resolve => setTimeout(resolve, 100));

      savedUser.role = 'Admin';
      const updatedUser = await savedUser.save();

      expect(updatedUser.createdAt.getTime()).toBe(originalCreatedAt.getTime());
    });
  });

  describe('isActive Field', () => {
    it('should default isActive to true', async () => {
      const user = new User({
        email: 'test@example.com',
        passwordHash: VALID_BCRYPT_HASH
      });
      const savedUser = await user.save();

      expect(savedUser.isActive).toBe(true);
    });

    it('should allow setting isActive to false', async () => {
      const user = new User({
        email: 'test@example.com',
        passwordHash: VALID_BCRYPT_HASH,
        isActive: false
      });
      const savedUser = await user.save();

      expect(savedUser.isActive).toBe(false);
    });

    it('should support soft delete by setting isActive to false', async () => {
      const user = new User({
        email: 'test@example.com',
        passwordHash: VALID_BCRYPT_HASH
      });
      const savedUser = await user.save();

      savedUser.isActive = false;
      const deletedUser = await savedUser.save();

      expect(deletedUser.isActive).toBe(false);

      const foundUser = await User.findById(deletedUser._id);
      expect(foundUser).toBeDefined();
      expect(foundUser.isActive).toBe(false);
    });
  });

  describe('Indexes', () => {
    it('should have unique index on email', async () => {
      // Create a document to ensure collection exists
      await new User({
        email: 'index-test@example.com',
        passwordHash: VALID_BCRYPT_HASH
      }).save();

      const indexes = await User.collection.getIndexes();
      // Check if email_1 index exists (MongoDB stores indexes as arrays in MongoMemoryServer)
      const hasEmailIndex = 'email_1' in indexes;
      expect(hasEmailIndex).toBe(true);
    });

    it('should have composite index on (email, isActive)', async () => {
      // Create a document to ensure collection exists
      await new User({
        email: 'composite-test@example.com',
        passwordHash: VALID_BCRYPT_HASH
      }).save();

      const indexes = await User.collection.getIndexes();
      // Check if composite index exists
      const hasCompositeIndex = 'email_1_isActive_1' in indexes;
      expect(hasCompositeIndex).toBe(true);
    });

    it('should have descending index on lastLoginAt', async () => {
      // Create a document to ensure collection exists
      await new User({
        email: 'login-test@example.com',
        passwordHash: VALID_BCRYPT_HASH
      }).save();

      const indexes = await User.collection.getIndexes();
      // Check if lastLoginAt index exists (with -1 for descending)
      const hasLoginIndex = 'lastLoginAt_-1' in indexes;
      expect(hasLoginIndex).toBe(true);
    });
  });

  describe('PasswordHash Validation', () => {
    it('should accept valid bcrypt hash (60 chars)', async () => {
      const user = new User({
        email: 'test@example.com',
        passwordHash: VALID_BCRYPT_HASH
      });
      const savedUser = await user.save();

      expect(savedUser.passwordHash).toBe(VALID_BCRYPT_HASH);
    });

    it('should require passwordHash with minimum length', async () => {
      const shortHash = 'short';
      const user = new User({
        email: 'test@example.com',
        passwordHash: shortHash
      });

      await expect(user.save()).rejects.toThrow(/minlength|at least 60/i);
    });
  });
});
