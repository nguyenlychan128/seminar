---
name: frontend-design
description: Tạo giao diện frontend độc đáo, đạt chất lượng production với thiết kế cao cấp. Sử dụng skill này khi người dùng yêu cầu xây dựng component, trang web hoặc ứng dụng. Tạo ra code sáng tạo, tinh chỉnh kỹ lưỡng và tránh thẩm mỹ AI rập khuôn.
license: Điều khoản đầy đủ trong LICENSE.txt
---

Skill này hướng dẫn tạo ra các giao diện frontend độc đáo, đạt chuẩn production, tránh thẩm mỹ “AI rác” chung chung. Hãy triển khai code thực tế với sự chú ý đặc biệt đến chi tiết thẩm mỹ và lựa chọn sáng tạo.

Người dùng cung cấp yêu cầu frontend: một component, trang, ứng dụng hoặc interface cần xây dựng. Họ có thể cung cấp thêm ngữ cảnh về mục đích, đối tượng sử dụng hoặc các ràng buộc kỹ thuật.

## Tư duy thiết kế

Trước khi code, hãy hiểu ngữ cảnh và cam kết một hướng thẩm mỹ RÕ RÀNG:

- **Mục đích**: Giao diện này giải quyết vấn đề gì? Ai là người sử dụng?
- **Tông (Tone)**: Chọn một cực đoan rõ ràng: tối giản khắc nghiệt, hỗn loạn tối đa, retro-futuristic, tự nhiên/hữu cơ, sang trọng/tinh tế, vui nhộn/đồ chơi, editorial/tạp chí, brutalist/thô ráp, art deco/hình học, mềm mại/pastel, công nghiệp/tiện dụng, v.v. Có rất nhiều phong cách để lựa chọn. Hãy dùng chúng làm cảm hứng nhưng thiết kế phải trung thành với định hướng đã chọn.
- **Ràng buộc**: Yêu cầu kỹ thuật (framework, hiệu năng, accessibility).
- **Sự khác biệt**: Điều gì khiến nó KHÔNG THỂ QUÊN? Người dùng sẽ nhớ điều gì nhất?

**QUAN TRỌNG**: Chọn một định hướng khái niệm rõ ràng và thực thi nó chính xác. Cả maximalism táo bạo và minimalism tinh tế đều hiệu quả — điều quan trọng là tính chủ đích, không phải cường độ.

Sau đó triển khai code hoạt động (HTML/CSS/JS, React, Vue, v.v.) với các tiêu chí:

- Đạt chuẩn production và hoạt động thực tế
- Ấn tượng về mặt thị giác và dễ ghi nhớ
- Đồng nhất với một góc nhìn thẩm mỹ rõ ràng
- Tinh chỉnh tỉ mỉ từng chi tiết

## Hướng dẫn thẩm mỹ Frontend

Tập trung vào:

- **Typography**: Chọn font đẹp, độc đáo và thú vị. Tránh các font phổ biến như Arial và Inter; thay vào đó chọn những font có cá tính để nâng tầm thẩm mỹ. Kết hợp một font display nổi bật với một font body tinh tế.
- **Màu sắc & Theme**: Cam kết một hệ thẩm mỹ nhất quán. Sử dụng CSS variables để đảm bảo consistency. Màu chủ đạo rõ ràng với điểm nhấn sắc nét tốt hơn palette nhạt nhòa, phân bổ đều.
- **Motion**: Sử dụng animation cho hiệu ứng và micro-interaction. Ưu tiên CSS thuần cho HTML. Với React, dùng thư viện Motion khi có thể. Tập trung vào các khoảnh khắc ấn tượng: một animation load trang được dàn dựng tốt với hiệu ứng xuất hiện theo nhịp (animation-delay) sẽ thú vị hơn nhiều micro-interaction rời rạc. Sử dụng scroll-trigger và hover bất ngờ.
- **Bố cục không gian**: Layout bất ngờ. Bất đối xứng. Chồng lớp. Dòng chảy chéo. Phá vỡ grid. Khoảng trắng rộng rãi HOẶC mật độ có kiểm soát.
- **Background & chi tiết hình ảnh**: Tạo chiều sâu và không khí thay vì chỉ dùng màu nền đơn. Thêm hiệu ứng và texture phù hợp với tổng thể. Sử dụng các yếu tố như gradient mesh, noise texture, pattern hình học, lớp transparency, shadow mạnh, border trang trí, cursor custom, grain overlay.

KHÔNG BAO GIỜ sử dụng thẩm mỹ AI rập khuôn như font phổ biến (Inter, Roboto, Arial, system fonts), bảng màu cliché (đặc biệt là gradient tím trên nền trắng), layout và pattern component quen thuộc, thiết kế “cookie-cutter” thiếu cá tính theo ngữ cảnh.

Hãy diễn giải sáng tạo và đưa ra lựa chọn bất ngờ nhưng hợp lý với ngữ cảnh. Không có thiết kế nào giống nhau. Thay đổi giữa light/dark theme, font khác nhau, phong cách khác nhau. KHÔNG BAO GIỜ hội tụ về các lựa chọn phổ biến (ví dụ Space Grotesk) qua nhiều lần tạo.

**QUAN TRỌNG**: Độ phức tạp triển khai phải phù hợp với tầm nhìn thẩm mỹ. Thiết kế maximalist cần code phức tạp với nhiều animation và hiệu ứng. Thiết kế tối giản/tinh tế cần sự tiết chế, chính xác và chú ý chi tiết (spacing, typography, subtle details). Sự thanh lịch đến từ việc thực thi tốt tầm nhìn.

Hãy nhớ: Claude có khả năng sáng tạo vượt trội. Đừng giới hạn bản thân — hãy thể hiện tối đa khả năng khi tư duy vượt khuôn khổ và cam kết hoàn toàn với một tầm nhìn độc đáo.
