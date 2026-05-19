# TASK-021 — BE: Setup workout-service Scaffold

## Description

Khởi tạo toàn bộ cấu trúc dự án cho `workout-service` (port 3003): Express app, Mongoose kết nối DB, logger, Axios HTTP client (để gọi user-service), cấu hình Jest, Dockerfile và `.env.example`. Đây là task nền tảng cho tất cả các task BE còn lại của feature workout-plan.

---

## Input

- `spec/features/workout-plan/feature.spec.md` — Service: `workout-service`, port 3003, phụ thuộc user-service
- Pattern chuẩn từ `BE/auth-service/` và `BE/user-service/` (Express, CommonJS, Winston, Jest + MongoMemoryServer)

---

## Output

```
BE/workout-service/
  ├── src/
  │   ├── server.js           # Entry point, lắng nghe port 3003
  │   ├── app.js              # Express app setup, middleware, routes
  │   ├── config/
  │   │   ├── database.js     # Mongoose connect/disconnect
  │   │   └── userServiceClient.js  # Axios instance gọi user-service
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

1. Tạo `BE/workout-service/package.json` với:
   - dependencies: `express`, `mongoose`, `jsonwebtoken`, `axios`, `dotenv`, `winston`
   - devDependencies: `jest`, `supertest`, `mongodb-memory-server`, `eslint`
   - scripts: `start`, `dev`, `test`, `lint`

2. Tạo `src/utils/logger.js` — Winston factory (console transport, log level từ `LOG_LEVEL` env).

3. Tạo `src/config/database.js` — `connectDatabase()` / `disconnectDatabase()` với pool config (min 5, max 20), timeouts 5000ms.

4. Tạo `src/config/userServiceClient.js` — Axios instance với:
   - `baseURL` từ env `USER_SERVICE_URL` (default: `http://localhost/api/users`)
   - Timeout 5000ms
   - Hàm `getUserProfile(accessToken)` → GET `/profile` với header `Authorization: Bearer <token>`
   - Xử lý lỗi: 404 → throw error với message "User profile not found"

5. Tạo `src/app.js` — Express app với:
   - Middleware: `express.json()`, request logging
   - Health check route: `GET /health → 200 { status: 'ok', service: 'workout-service' }`
   - Placeholder router: `app.use('/exercises', require('./routes/exercise.routes'))`  
   - Placeholder router: `app.use('/plans', require('./routes/plan.routes'))`
   - 404 handler và global error handler

6. Tạo `src/routes/exercise.routes.js` và `src/routes/plan.routes.js` — file rỗng export `express.Router()` để app.js không lỗi khi import.

7. Tạo `src/server.js` — gọi `connectDatabase()` rồi `app.listen(PORT)`.

8. Tạo `jest.config.js` — coverage threshold 80%, testEnvironment node, testTimeout 30000.

9. Tạo `Dockerfile` — multi-stage build, non-root user, EXPOSE 3003. Copy từ `BE/user-service/Dockerfile` và chỉnh PORT.

10. Tạo `.env.example`:
    ```
    NODE_ENV=development
    PORT=3003
    MONGO_URI=mongodb://localhost:27017/fitgainer-workout
    JWT_SECRET=<32+ chars, same as auth-service>
    USER_SERVICE_URL=http://localhost/api/users
    RABBITMQ_URL=amqp://localhost:5672
    LOG_LEVEL=debug
    ```

11. Viết `tests/unit/logger.test.js` — kiểm tra logger khởi tạo thành công, có methods: `info`, `error`, `warn`.

---

## Acceptance Criteria

- [ ] `npm test` chạy xanh (logger unit test pass, ≥ 1 test)
- [ ] `npm run lint` zero warnings
- [ ] `docker build .` thành công từ `BE/workout-service/`
- [ ] `GET /health` trả `200 { status: 'ok', service: 'workout-service' }`
- [ ] `userServiceClient.js` export được function `getUserProfile`
- [ ] Coverage ≥ 80% cho `utils/logger.js`
- [ ] Không có hard-coded credentials trong source

---

## Mapping

- Feature: `spec/features/workout-plan/feature.spec.md` — workout-service, port 3003
- Rules: `spec/features/workout-plan/rules.spec.md` — SR-03 (workout-service gọi user-service nội bộ)
- Pattern: `BE/user-service/` (reference implementation)
