# Description

Gọi agent doc-updater thực hiện nhiệm vụ cập nhật các document có đuôi .md liên quan,phụ thuộc đến task đang thực hiện

# Prompt

## Sử dụng agent doc-updater để cập nhật,viết,tạo document cho `task/feature/TASK-`

# Luật lệ phải tuân theo

- Buộc phải đọc và cập nhật file readme ở thư mục cha của dự án `SGU_SEMINAR_CHUYENDE/README.md`
- Buộc phải đọc và cập nhật file story-to-spec ở thư mục `SGU_SEMINAR_CHUYENDE/spec/mapping/story-to-spec.md`
- Buộc phải đọc và cập nhật file INDEX ở thư mục `SGU_SEMINAR_CHUYENDE/docs/CODEMAPS/INDEX.md`
- Trong thự mục `SGU_SEMINAR_CHUYENDE/docs/CODEMAPS/INDEX.md`, mỗi khi task liên quan đến BE thì tham khảo các file ví dụ `auth-service.md` để tạo file `name-service.md` lần đầu tiên cho task đó nếu là có liên quan đến BE và cập nhật mỗi khi có task liên quan đến BE.Tương tự như vậy cũng áp dụng cho task liên quan đến FE.Bạn có thể liệt kê ra các file .md thư mục `CODEMAPS` để hiểu rõ quy luật.
- Đối với mỗi service trong thư mục `BE` phải có file README.md đàng hoàng, và nó được khởi tạo nếu chưa có và được cập nhật khi task có liên quan đến BE của service đó.Bạn có thể tham khảo các service khác để hiểu thêm.
- Đối với thư mục `FE` của dự án thì cũng cập nhật file README.md nếu task có liên quan đến frontend.
- Có thể cập nhật,khởi tạo thêm các file khác nếu người dùng yêu cầu.
