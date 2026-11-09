// Danh sách 63 tỉnh/thành phố Việt Nam chia theo vùng và các thành phố lớn
export const VIETNAM_MAJOR_CITIES = [
  'Hà Nội',
  'TP. Hồ Chí Minh',
  'Đà Nẵng',
  'Hải Phòng',
  'Cần Thơ'
];

export const VIETNAM_REGIONS = [
  {
    region: 'Thành phố lớn',
    provinces: [
      'Hà Nội',
      'TP. Hồ Chí Minh',
      'Đà Nẵng',
      'Hải Phòng',
      'Cần Thơ'
    ]
  },
  {
    region: 'Miền Bắc',
    provinces: [
      'Bắc Giang',
      'Bắc Kạn',
      'Bắc Ninh',
      'Cao Bằng',
      'Điện Biên',
      'Hà Giang',
      'Hà Nam',
      'Hải Dương',
      'Hòa Bình',
      'Hưng Yên',
      'Lai Châu',
      'Lạng Sơn',
      'Lào Cai',
      'Nam Định',
      'Ninh Bình',
      'Phú Thọ',
      'Quảng Ninh',
      'Sơn La',
      'Thái Bình',
      'Thái Nguyên',
      'Tuyên Quang',
      'Vĩnh Phúc',
      'Yên Bái'
    ]
  },
  {
    region: 'Miền Trung & Tây Nguyên',
    provinces: [
      'Bình Định',
      'Bình Thuận',
      'Đắk Lắk',
      'Đắk Nông',
      'Gia Lai',
      'Hà Tĩnh',
      'Khánh Hòa',
      'Kon Tum',
      'Lâm Đồng',
      'Nghệ An',
      'Ninh Thuận',
      'Phú Yên',
      'Quảng Bình',
      'Quảng Nam',
      'Quảng Ngãi',
      'Quảng Trị',
      'Thanh Hóa',
      'Thừa Thiên Huế'
    ]
  },
  {
    region: 'Miền Nam',
    provinces: [
      'An Giang',
      'Bà Rịa - Vũng Tàu',
      'Bạc Liêu',
      'Bến Tre',
      'Bình Dương',
      'Bình Phước',
      'Cà Mau',
      'Đồng Nai',
      'Đồng Tháp',
      'Hậu Giang',
      'Kiên Giang',
      'Long An',
      'Sóc Trăng',
      'Tây Ninh',
      'Tiền Giang',
      'Trà Vinh',
      'Vĩnh Long'
    ]
  }
];

// Danh sách phẳng tất cả tỉnh thành (đã sắp xếp)
export const ALL_VIETNAM_PROVINCES = [
  ...VIETNAM_MAJOR_CITIES,
  ...VIETNAM_REGIONS.flatMap(r => r.provinces).filter((p, i, self) => self.indexOf(p) === i)
];
