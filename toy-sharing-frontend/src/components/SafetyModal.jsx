import React from 'react';
import { Modal, Typography, Steps, Alert, Divider } from 'antd';
import { SafetyCertificateOutlined } from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;

export default function SafetyModal({ isOpen, onClose }) {
  return (
    <Modal open={isOpen} onCancel={onClose} onOk={onClose} okText="Tôi đã hiểu" cancelButtonProps={{ style: { display: 'none' } }} width={680} title={<span><SafetyCertificateOutlined style={{ color: 'var(--color-primary)' }} /> An toàn & Bảo vệ tiền cọc tại ToyShare</span>}>
      <Paragraph type="secondary">Quy trình minh bạch giúp cả chủ đồ chơi và người mượn yên tâm.</Paragraph>

      <Title level={5} style={{ marginTop: 16 }}>1. Ký quỹ tiền cọc qua VietQR (Escrow)</Title>
      <Alert type="success" showIcon message="Tiền cọc do hệ thống giữ, không chuyển thẳng cho chủ đồ"
        description="Người mượn chuyển cọc vào tài khoản ký quỹ của ToyShare qua mã VietQR. Admin xác nhận đã nhận cọc trước khi chủ giao đồ, và hoàn cọc sau khi trả đồ." />

      <Title level={5} style={{ marginTop: 20 }}>2. Bằng chứng ảnh 2 đầu</Title>
      <Steps direction="vertical" size="small" current={-1} items={[
        { title: 'Lúc giao đồ', description: 'Chủ đồ chơi chụp ảnh tình trạng đồ chơi (bắt buộc khi có cọc) làm bằng chứng "trước".' },
        { title: 'Lúc trả đồ', description: 'Người mượn chụp ảnh tình trạng khi trả làm bằng chứng "sau".' },
        { title: 'Khi có tranh chấp', description: 'Admin so sánh ảnh hai bên để phân xử công bằng, tránh khai khống.' },
      ]} />

      <Title level={5} style={{ marginTop: 8 }}>3. Chính sách xử lý hư hỏng</Title>
      <Paragraph style={{ color: '#52473f' }}>
        Hao mòn tự nhiên (xước nhẹ, mòn màu) được <Text strong>miễn trừ</Text>. Nếu đồ chơi hư hỏng nặng hoặc mất linh kiện, chủ đồ chơi khai báo kèm ảnh; người mượn có quyền phản hồi; admin xem bằng chứng hai bên rồi quyết số tiền trừ (từ 0 đến mức cọc), phần còn lại hoàn cho người mượn.
      </Paragraph>

      <Divider style={{ margin: '12px 0' }} />
      <Paragraph type="secondary" style={{ margin: 0, fontSize: 13 }}>
        Vì sức khỏe cộng đồng, chủ đồ chơi cam kết vệ sinh sạch sẽ và kiểm tra an toàn trước khi cho mượn.
      </Paragraph>
    </Modal>
  );
}
