# Progress Tracking Feature Specification

## Overview

**Progress Tracking** cho phép người dùng cập nhật cân nặng theo thời gian và xem biểu đồ sự thay đổi để theo dõi quá trình tăng cân. Tính năng này giúp người dùng có động lực và đánh giá hiệu quả của lộ trình tập luyện.

**Scope (Phase 1):**
- Ghi log cân nặng hàng ngày (1 entry/day)
- Xem lịch sử cân nặng (danh sách + biểu đồ)
- Không include: Adaptive Plan, Advanced Analytics

---

## Related User Stories

- **US-PT-1:** Người dùng muốn cập nhật cân nặng theo thời gian để theo dõi quá trình tăng cân
- **US-PT-2:** Người dùng muốn xem biểu đồ thể hiện sự thay đổi cân nặng để có động lực

---

## Key Responsibilities

### Backend (progress-service)
- **Create Weight Log:** POST `/api/progress/weight` — ghi log cân nặng + ngày
- **Get Weight History:** GET `/api/progress/weight?startDate=...&endDate=...` — lấy lịch sử cân nặng
- Validate: cân nặng hợp lệ (30-200kg), không tạo 2 entry cùng ngày

### Frontend
- **Progress Dashboard:** Trang hiển thị biểu đồ cân nặng + form ghi log
- **Weight Input Form:** Form đơn giản (ngày + cân nặng) với validation
- **Weight Chart:** Biểu đồ line chart hiển thị trend cân nặng

---

## Acceptance Criteria

✅ Người dùng có thể ghi cân nặng hôm nay qua form  
✅ Cân nặng được lưu vào database với timestamp  
✅ Hiển thị danh sách 30 ngày weight history (hoặc từ ngày tạo profile)  
✅ Hiển thị line chart trend cân nặng  
✅ Validation: cân nặng 30-200kg, không tạo 2 entry cùng ngày  
✅ API response include: date, weight, trend (so với ngày trước)  
