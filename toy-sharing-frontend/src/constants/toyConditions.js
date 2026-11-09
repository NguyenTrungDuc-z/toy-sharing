// Nguồn duy nhất cho 3 mức tình trạng đồ chơi + tiêu chí (rubric) để thống nhất
// nhãn hiển thị khắp ứng dụng và làm cơ sở đối chiếu khi bàn giao/trả đồ.
export const TOY_CONDITIONS = [
  {
    value: 'new',
    label: 'Mới',
    color: 'green',
    rubric: 'Còn nguyên hộp/tem, đầy đủ phụ kiện, chưa qua sử dụng, không trầy xước, sạch sẽ, hoạt động 100%.',
  },
  {
    value: 'like_new',
    label: 'Như mới',
    color: 'cyan',
    rubric: 'Đã dùng rất ít, còn đủ phụ kiện chính, không hư hại nhìn thấy, vệ sinh tốt, hoạt động đầy đủ.',
  },
  {
    value: 'used',
    label: 'Đã dùng',
    color: 'default',
    rubric: 'Dùng nhiều, có thể trầy/xước nhẹ hoặc thiếu phụ kiện phụ, nhưng vẫn sạch và hoạt động bình thường.',
  },
];

export const CONDITION_LABEL = Object.fromEntries(TOY_CONDITIONS.map(c => [c.value, c.label]));
export const CONDITION_COLOR = Object.fromEntries(TOY_CONDITIONS.map(c => [c.value, c.color]));
export const CONDITION_RUBRIC = Object.fromEntries(TOY_CONDITIONS.map(c => [c.value, c.rubric]));
