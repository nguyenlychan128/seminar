---
name: security-review
description: Sử dụng skill này khi triển khai authentication, xử lý input người dùng, làm việc với secrets, tạo API endpoint hoặc xây dựng các tính năng nhạy cảm như thanh toán. Cung cấp checklist và pattern bảo mật toàn diện.
origin: ECC
---

---

# Security Review Skill

Skill này đảm bảo tất cả code tuân theo best practice bảo mật và phát hiện các lỗ hổng tiềm ẩn.

## Khi nào kích hoạt

- Implement authentication hoặc authorization
- Xử lý input người dùng hoặc upload file
- Tạo API endpoint mới
- Làm việc với secrets hoặc credentials
- Implement tính năng thanh toán
- Lưu trữ hoặc truyền dữ liệu nhạy cảm
- Tích hợp API bên thứ ba

## Checklist bảo mật

### 1. Quản lý Secrets

#### FAIL: TUYỆT ĐỐI KHÔNG làm

```typescript
const apiKey = "sk-proj-xxxxx"; // Hardcode secret
const dbPassword = "password123"; // Trong source code
```

#### PASS: LUÔN LUÔN làm

```typescript
const apiKey = process.env.OPENAI_API_KEY;
const dbUrl = process.env.DATABASE_URL;

// Kiểm tra secret tồn tại
if (!apiKey) {
  throw new Error("OPENAI_API_KEY chưa được cấu hình");
}
```

#### Các bước xác minh

- [ ] Không có API key/token/password hardcode
- [ ] Tất cả secrets nằm trong env
- [ ] `.env.local` có trong .gitignore
- [ ] Không có secret trong git history
- [ ] Secret production lưu trên platform (Vercel, Railway)

### 2. Validate Input

#### Luôn validate input người dùng

```typescript
import { z } from "zod";

// Schema validate
const CreateUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
  age: z.number().int().min(0).max(150),
});

// Validate trước khi xử lý
export async function createUser(input: unknown) {
  try {
    const validated = CreateUserSchema.parse(input);
    return await db.users.create(validated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error.errors };
    }
    throw error;
  }
}
```

#### Validate file upload

```typescript
function validateFileUpload(file: File) {
  // Check size (max 5MB)
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    throw new Error("File quá lớn (max 5MB)");
  }

  // Check type
  const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
  if (!allowedTypes.includes(file.type)) {
    throw new Error("Loại file không hợp lệ");
  }

  // Check extension
  const allowedExtensions = [".jpg", ".jpeg", ".png", ".gif"];
  const extension = file.name.toLowerCase().match(/\.[^.]+$/)?.[0];
  if (!extension || !allowedExtensions.includes(extension)) {
    throw new Error("Extension file không hợp lệ");
  }

  return true;
}
```

#### Các bước xác minh

- [ ] Tất cả input được validate bằng schema
- [ ] Upload file bị giới hạn (size, type, extension)
- [ ] Không dùng trực tiếp input trong query
- [ ] Dùng whitelist (không dùng blacklist)
- [ ] Error không lộ thông tin nhạy cảm

### 3. Chống SQL Injection

#### FAIL: KHÔNG nối string SQL

```typescript
// NGUY HIỂM
const query = `SELECT * FROM users WHERE email = '${userEmail}'`;
await db.query(query);
```

#### PASS: LUÔN dùng parameterized query

```typescript
// An toàn
const { data } = await supabase
  .from("users")
  .select("*")
  .eq("email", userEmail);

// Hoặc raw SQL
await db.query("SELECT * FROM users WHERE email = $1", [userEmail]);
```

#### Các bước xác minh

- [ ] Query dùng parameterized
- [ ] Không nối string SQL
- [ ] ORM dùng đúng
- [ ] Supabase query được sanitize

### 4. Authentication & Authorization

#### Xử lý JWT

```typescript
// FAIL: localStorage (dễ bị XSS)
localStorage.setItem("token", token);

// PASS: httpOnly cookie
res.setHeader(
  "Set-Cookie",
  `token=${token}; HttpOnly; Secure; SameSite=Strict; Max-Age=3600`,
);
```

#### Kiểm tra quyền

```typescript
export async function deleteUser(userId: string, requesterId: string) {
  const requester = await db.users.findUnique({
    where: { id: requesterId },
  });

  if (requester.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  await db.users.delete({ where: { id: userId } });
}
```

#### Row Level Security (Supabase)

```sql
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own data"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users update own data"
  ON users FOR UPDATE
  USING (auth.uid() = id);
```

#### Các bước xác minh

- [ ] Token lưu trong httpOnly cookie
- [ ] Có check quyền trước thao tác nhạy cảm
- [ ] Bật RLS trong Supabase
- [ ] Có role-based access control
- [ ] Session an toàn

### 5. Chống XSS

#### Sanitize HTML

```typescript
import DOMPurify from 'isomorphic-dompurify'

function renderUserContent(html: string) {
  const clean = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p'],
    ALLOWED_ATTR: []
  })
  return <div dangerouslySetInnerHTML={{ __html: clean }} />
}
```

#### Content Security Policy

```typescript
// next.config.js
const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: `
      default-src 'self';
      base-uri 'self';
      object-src 'none';
      frame-ancestors 'none';
      script-src 'self';
      style-src 'self';
      img-src 'self' data: https:;
      font-src 'self';
      connect-src 'self' https://api.example.com;
    `
      .replace(/\s{2,}/g, " ")
      .trim(),
  },
];
```

#### Các bước xác minh

- [ ] HTML user được sanitize
- [ ] Có CSP header
- [ ] Không render content động chưa validate
- [ ] Dùng protection của React

### 6. CSRF Protection

#### CSRF token

```typescript
import { csrf } from "@/lib/csrf";

export async function POST(request: Request) {
  const token = request.headers.get("X-CSRF-Token");

  if (!csrf.verify(token)) {
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
  }
}
```

#### Cookie SameSite

```typescript
res.setHeader(
  "Set-Cookie",
  `session=${sessionId}; HttpOnly; Secure; SameSite=Strict`,
);
```

#### Các bước xác minh

- [ ] Có CSRF token
- [ ] Cookie dùng SameSite=Strict
- [ ] Double-submit cookie pattern

### 7. Rate Limiting

```typescript
import rateLimit from "express-rate-limit";

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests",
});

app.use("/api/", limiter);
```

#### Các bước xác minh

- [ ] Có rate limit cho API
- [ ] Strict hơn cho API nặng
- [ ] Limit theo IP
- [ ] Limit theo user

### 8. Lộ dữ liệu nhạy cảm

#### Logging

```typescript
// FAIL
console.log("User login:", { email, password });

// PASS
console.log("User login:", { email, userId });
```

#### Error

```typescript
// FAIL
return { error: error.message, stack: error.stack };

// PASS
return { error: "Đã xảy ra lỗi, vui lòng thử lại" };
```

#### Các bước xác minh

- [ ] Không log password/token
- [ ] Error không lộ info
- [ ] Stack trace không gửi client

### 9. Blockchain Security (Solana)

```typescript
import { verify } from "@solana/web3.js";
```

#### Các bước xác minh

- [ ] Verify chữ ký ví
- [ ] Validate transaction
- [ ] Check balance
- [ ] Không sign mù

### 10. Dependency Security

```bash
npm audit
npm audit fix
npm update
npm outdated
```

#### Các bước xác minh

- [ ] Dependency up-to-date
- [ ] Không có vulnerability
- [ ] Commit lock file
- [ ] Dùng `npm ci` trong CI/CD

## Security Testing

```typescript
test("requires authentication", async () => {
  const response = await fetch("/api/protected");
  expect(response.status).toBe(401);
});
```

## Checklist trước deploy

- [ ] Không hardcode secret
- [ ] Validate input
- [ ] Query an toàn
- [ ] Chống XSS
- [ ] Có CSRF
- [ ] Auth đúng
- [ ] Có phân quyền
- [ ] Rate limit
- [ ] HTTPS
- [ ] Security headers
- [ ] Error an toàn
- [ ] Logging an toàn
- [ ] Dependency sạch
- [ ] RLS bật
- [ ] CORS đúng
- [ ] Upload validate

---

**Ghi nhớ**: Bảo mật không phải tùy chọn. Một lỗ hổng có thể phá hủy toàn bộ hệ thống. Khi không chắc, hãy chọn phương án an toàn.
