# TASK-015 — BE: Setup user-service Scaffold

## Description

Khởi tạo toàn bộ cấu trúc dự án cho `user-service` (port 3002): Express app, Mongoose kết nối DB, logger, cấu hình Jest, Dockerfile và `.env.example`. Đây là task nền tảng cho tất cả các task BE còn lại của feature user-profile.

---

## Input

- `spec/features/user-profile/feature.spec.md` — Service: `user-service`, port 3002
- Pattern chuẩn từ `BE/auth-service/` (Express, CommonJS, Winston, Jest + MongoMemoryServer)

---

## Output

Thư mục `BE/user-service/` với cấu trúc:

```
BE/user-service/
  ├── src/
  │   ├── server.js           # Entry point, lắng nghe port
  │   ├── app.js              # Express app setup, middleware, routes
  │   ├── config/
  │   │   └── database.js     # Mongoose connect/disconnect
  │   └── utils/
  │       └── logger.js       # Winston logger factory
  ├── tests/
  │   └── unit/
  │       └── logger.test.js  # Unit test logger
  ├── package.json
  ├── jest.config.js
  ├── Dockerfile
  └── .env.example
```

---

## Steps

1. Tạo `BE/user-service/package.json` với dependencies: express, mongoose, jsonwebtoken, dotenv, winston. devDependencies: jest, supertest, mongodb-memory-server.
2. Tạo `src/utils/logger.js` — Winston factory (console transport, log level từ env).
3. Tạo `src/config/database.js` — `connectDatabase()` / `disconnectDatabase()` với pool config (min 5, max 20), timeouts 5000ms.
4. Tạo `src/app.js` — Express app với middleware: `express.json()`, cors (nếu cần), health check route `GET /health → 200 { status: 'ok' }`.
5. Tạo `src/server.js` — gọi `connectDatabase()` rồi `app.listen(PORT)`.
6. Tạo `jest.config.js` — coverage threshold 80%, testEnvironment node.
7. Tạo `Dockerfile` — multi-stage build, non-root user, EXPOSE 3002.
8. Tạo `.env.example` theo chuẩn CLAUDE.md (NODE_ENV, PORT=3002, MONGO_URI, JWT_SECRET, RABBITMQ_URL, LOG_LEVEL).
9. Viết `tests/unit/logger.test.js` — kiểm tra logger khởi tạo thành công, có method info/error/warn.

---

## Acceptance Criteria

- [ ] `npm test` chạy xanh (logger unit test pass)
- [ ] `npm run lint` zero warnings
- [ ] `docker build .` thành công từ `BE/user-service/`
- [ ] `GET /health` trả `200 { status: 'ok' }`
- [ ] Coverage ≥ 80% cho `utils/logger.js`
- [ ] Không có hard-coded credentials trong source

---

## Mapping

- Feature: `spec/features/user-profile/feature.spec.md` — user-service, port 3002
- Schema: `spec/features/user-profile/schema.spec.md` — collection `userprofiles`
- Pattern: `BE/auth-service/` (reference implementation)
