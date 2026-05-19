---
name: git-commit-and-push
description: Stage, commit và push code lên branch feature/<feature-name> theo chuẩn Conventional Commits
---

---

# 🚀 Git Commit & Push (Feature Branch)

Tự động thực hiện:

```bash
git add → git commit → git checkout feature/<feature> → git push
```

---

## 📥 Input

- Task name (ví dụ: `task-02-login-service`)
- Feature name (ví dụ: `auth`)

---

## 🎯 Mục tiêu

- Commit theo từng task
- Push lên đúng branch: `feature/<feature-name>`
- Không ảnh hưởng branch chính (main)

---

## ⚙️ Quy trình thực hiện

### 1. Kiểm tra trạng thái

```bash
git status
```

---

### 2. Stage code

```bash
git add .
```

---

### 3. Phân tích thay đổi

```bash
git diff --staged
```

---

### 4. Tạo commit message

Format:

```
<type>(<feature>): <mô tả ngắn>
```

Ví dụ:

```
feat(auth): implement login service
```

---

### 5. Commit

```bash
git commit -m "<message>"
```

---

### 6. Chuyển sang branch feature

```bash
git checkout -B feature/<feature-name>
```

Ví dụ:

```bash
git checkout -B feature/auth
```

---

### 7. Push lên remote

```bash
git push -u origin feature/<feature-name>
```

---

## 📌 Type commit

- feat
- fix
- docs
- refactor
- test
- chore

---

## 🔥 Mapping với Task

- 1 task = 1 commit
- Không gộp nhiều task

---

## 📤 Output

### Commit message

```
feat(auth): implement login service
```

---

### Lệnh thực thi

```bash
git add .
git commit -m "feat(auth): implement login service"
git checkout -B feature/auth
git push -u origin feature/auth
```

---

## ⚠️ Điều kiện an toàn

❌ Không chạy nếu:

- Code chưa chạy
- Có lỗi build
- Chưa test

---

## 💡 Best Practice

- Mỗi feature = 1 branch riêng
- Không push trực tiếp lên main
- Sau khi xong feature → tạo Pull Request

---

## 🚀 Cách sử dụng

```
Use skill: git-commit-and-push

Task: task-02-login-service
Feature: auth
```

---
