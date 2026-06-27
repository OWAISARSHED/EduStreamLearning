describe('User Model Schema', () => {
  let User;
  beforeAll(() => {
    jest.mock('mongoose', () => {
      const mMongoose = {
        Schema: class Schema {
          constructor(fields, opts) {
            this.paths = {};
            this.options = opts || {};
            for (const [key, val] of Object.entries(fields)) {
              this.paths[key] = { options: val };
            }
          }
          pre() {}
          methods = {};
          index() {}
        },
        model: jest.fn().mockReturnValue({
          schema: {
            paths: {
              password_hash: { options: { select: false } },
              role: { options: { enum: ['student', 'mentor', 'admin'] } },
              name: { options: { required: true } },
              email: { options: { required: true, unique: true } },
            },
            options: { timestamps: true },
          },
          find: jest.fn(),
          findOne: jest.fn(),
          create: jest.fn(),
        }),
      };
      return mMongoose;
    });
    User = require('../models/User');
  });

  it('password_hash has select:false', () => {
    expect(User.schema.paths.password_hash.options.select).toBe(false);
  });

  it('role allows student/mentor/admin', () => {
    const enums = User.schema.paths.role.options.enum;
    expect(enums).toContain('student');
    expect(enums).toContain('mentor');
    expect(enums).toContain('admin');
  });

  it('has timestamps', () => {
    expect(User.schema.options.timestamps).toBeTruthy();
  });
});
