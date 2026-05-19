# Description

Chuyển đổi Business Context và User Stories thành hệ thống Specification (System Spec) chuyên nghiệp.

# Prompt

Bạn là một Software Architect Senior. Nhiệm vụ của bạn là chuyển đổi business context và user stories thành hệ thống specification (spec) rõ ràng, có cấu trúc, dùng được để phát triển phần mềm.

---

## 📥 Input

- business/context.md
- business/user-stories.md

---

## 🎯 Mục tiêu

1. Chuẩn hóa lại user stories
2. Phân nhóm (group) user stories theo feature/domain
3. Tạo spec cho từng feature
4. Đảm bảo có thể trace từ user story → spec

---

## 🧠 Các bước thực hiện

### Bước 1: Chuẩn hóa user stories

Mỗi user story phải có format:

- ID
- Mô tả (Description)
- Tiêu chí chấp nhận (Acceptance Criteria)

---

### Bước 2: Phân nhóm theo feature

- Gom các user stories có liên quan vào cùng một feature
- Đặt tên feature rõ ràng (ví dụ: auth, workout, progress)

---

### Bước 3: Tạo spec cho từng feature

Với mỗi feature, tạo cấu trúc:

spec/features/<feature-name>/

Bao gồm các file:

1. feature.spec.md
   - Mô tả tổng quan feature
   - Liệt kê các user stories liên quan

2. api.spec.md
   - Danh sách endpoint
   - Method (GET, POST,...)
   - Input / Output cơ bản

3. schema.spec.md
   - Các model dữ liệu (MongoDB)
   - Các field chính

4. rules.spec.md
   - Business rules
   - Validation
   - Constraint

---

### Bước 4: Tạo mapping

Tạo file:

spec/mapping/story-to-spec.md

Nội dung:

- Mỗi user story phải map tới ít nhất 1 feature
- Không được bỏ sót user story nào

---

## 📌 Quy tắc

- Không viết code
- Không gộp tất cả spec vào một file
- Mỗi feature phải tách riêng
- Không được mất requirement từ user stories
- Đặt tên rõ ràng, dùng kebab-case
- Spec phải ngắn gọn, dễ đọc, dễ hiểu

---

## 📤 Output

Trả về đầy đủ nội dung cho:

- spec/features/_/_
- spec/mapping/story-to-spec.md

Theo cấu trúc rõ ràng, có thể dùng ngay để phát triển.
