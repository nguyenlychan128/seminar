# Feature Spec: Administration Dashboard

## 🎯 Overview
Admin dashboard cho phép quản trị viên quản lý người dùng, bài tập và lộ trình tập luyện. Tập trung vào các chức năng thiết yếu: xem danh sách người dùng, vô hiệu hóa tài khoản (soft delete), quản lý bài tập.

**Architecture:** 2 backend services (auth-service + workout-service) + 1 frontend dashboard

---

## 👥 Related User Stories

1. **US-Admin-01**: Là một quản trị viên, tôi muốn quản lý danh sách bài tập (thêm, sửa, xóa).
2. **US-Admin-02**: Là một quản trị viên, tôi muốn quản lý người dùng trong hệ thống.
3. **US-Access-01**: Khi người dùng đăng nhập với vai trò Admin, họ sẽ được chuyển đến trang quản trị.

---

## 🔑 Key Features

### Feature A: Admin User Management (auth-service)
- **Xem danh sách người dùng** (phân trang, lọc theo email/status)
- **Vô hiệu hóa tài khoản người dùng** (soft delete, không xóa vĩnh viễn)
- **Chi tiết người dùng** (profile, workout progress)

### Feature B: Admin Exercise Management (workout-service)
- **Xem danh sách bài tập** (phân trang, tìm kiếm)
- **Tạo bài tập mới**
- **Chỉnh sửa bài tập**
- **Xóa bài tập** (soft delete)

---

## 🔒 IMPORTANT: No Hard Delete
- **User deletion**: Soft delete only. Set `isDeleted: true` flag. Keep data for analytics.
- **Exercise deletion**: Soft delete only. Set `isDeleted: true` flag.
- Backend returns `400 Bad Request` if hard delete is attempted via API.

---

## 📊 Scope (90-min target, 3 tasks)

**Backend Task 1 (TASK-031-BE-Auth-Admin): ~30 min**
- Service: `auth-service` (port 3001)
- Scope: User API for admin
- Features: `GET /api/admin/users`, `PATCH /api/admin/users/:id` (deactivate only)

**Backend Task 2 (TASK-031-BE-Workout-Admin): ~30 min**
- Service: `workout-service` (port 3003)
- Scope: Exercise API for admin
- Features: `GET /api/admin/exercises`, `POST`, `PATCH`, `DELETE` (soft-delete)

**Frontend Task 3 (TASK-031-FE-Admin-Dashboard): ~45 min**
- Admin layout (sidebar, header)
- Users page: table, deactivate modal
- Exercises page: table, add/edit form, delete confirmation
- Redirect non-admin to login
- Consume both backend APIs via Nginx gateway

---

## ✅ Acceptance Criteria

**Backend:**
- [ ] Admin users only (401 if not admin)
- [ ] User list: pagination, email search filter, soft delete flag
- [ ] Exercise CRUD: pagination, search, soft delete
- [ ] All endpoints tested (TDD, ≥80% coverage)

**Frontend:**
- [ ] Admin dashboard with protected routes
- [ ] Users table with deactivate button + confirmation modal
- [ ] Exercises table with add/edit/delete
- [ ] TailwindCSS styling only
- [ ] Form validation
- [ ] All tests green (TDD, ≥80% coverage)

---

## 🗂️ Database Impact

**User collection:**
```javascript
{
  _id, email, password, role, isDeleted, createdAt, updatedAt
  // isDeleted: true = deactivated, not shown in user list
}
```

**Exercise collection:**
```javascript
{
  _id, name, description, muscleGroup, sets, reps, restTime, isDeleted, createdAt, updatedAt
  // isDeleted: true = soft deleted, not returned in list
}
```

---

## 🚀 V1 Constraints
- No bulk operations (one-by-one only)
- No audit logs
- No role assignment (users always "User", admins pre-created)
- Exercise list only (no history or versioning)
