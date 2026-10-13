/* Typing Tutor - Thai course (Kedmanee layout). UI stays English, exercises are Thai. */
window.TT = window.TT || {};

var TH_LESSONS = [
  {
    id: "TH01",
    name: "Lesson  1   Home Row  ฟ ห ก ด  เ ◌้ ◌่ ◌า ส ว ง",
    focus: "Middle row: a s d f g h j k l ; '  ->  ฟ ห ก ด เ ◌้ ◌่ ◌า ส ว ง. Fingers rest on ฟ ห ก ด and ◌า ส ว",
    keys: "asdfjkl;'",
    passWpm: 10,
    passAcc: 95,
    text: `ฟหกด ฟหกด สวสว สวสว
ดา หา เหา เดา เกา ด่า ห้า
เห เก เหา เห้า เดา เกา ด่า
ฟ้า เสา หวง งา กด หก สด สาว
วาด สวด กวด ดก หา เสา ฟ้า`
  },
  {
    id: "TH02",
    name: "Lesson  2   Home Row  Word Chains",
    focus: "Thai words run together without spaces. Keep the rhythm, do not look down",
    keys: "asdfjkl;'",
    passWpm: 13,
    passAcc: 95,
    text: `เดาเหา เกาเห้า กดหก สดสาว
วาดสวด กวดดก หาฟ้า เสาหวง
งางา หวงงา เสาฟ้า เห้าหา
สดสาว วาดฟ้า เดาสด หกกด`
  },
  {
    id: "TH03",
    name: "Lesson  3   Top Row Left  ๆ ไ ◌ำ พ ◌ะ",
    focus: "Keys q w e r t  ->  ๆ ไ ◌ำ พ ◌ะ. Reach up from the middle row and snap back",
    keys: "qwert",
    passWpm: 15,
    passAcc: 95,
    text: `กะดำ พะไว กะดำ พะไว
กะ สะ พะ กำ ดำ สำ
ไฟ ไก พา พะ กำดำ สำพะ
ดำๆ ไฟๆ พาๆ กะๆ สะๆ`
  },
  {
    id: "TH04",
    name: "Lesson  4   Top Row Right  ◌ั ◌ี ร น ย บ ล",
    focus: "Keys y u i o p [ ]  ->  ◌ั ◌ี ร น ย บ ล. Right pinky takes p [ ]",
    keys: "ypi[]",
    passWpm: 17,
    passAcc: 95,
    text: `กันดี รันสี กันดี รันสี
กัน วัน พัน ดี สี ยา ยาว
ราก น้ำ บน บาน ลา ลาง ลาว
ไหว้ เรียน บ้าน ลง หลง รัน`
  },
  {
    id: "TH05",
    name: "Lesson  5   Bottom Row  ผ ป แ อ ◌ิ ◌ื ท ม ใ ฝ",
    focus: "Bottom row: z x c v b n m , . /  ->  ผ ป แ อ ◌ิ ◌ื ท ม ใ ฝ. One finger only, the hand stays put",
    keys: "zxcvbnm,./",
    passWpm: 19,
    passAcc: 95,
    text: `ทำมี แอผา ทำมี แอผา
ทำ มี มา มือ มีด ใส ฝัน
ผิว อาย อา ผี ปา มด ทหาร
อาหาร เมือง นักเรียน ไทยเรียนดี
แม่ทำอาหาร นักเรียนเรียนดี`
  },
  {
    id: "TH06",
    name: "Lesson  6   Number Row Letters  ๅ / - ภ ถ ค ต จ ข ช",
    focus: "Number row letters: 1 2 3 4 5 6 7 8 9 0 - =  ->  ๅ / - ภ ถ ◌ุ ◌ึ ค ต จ ข ช. Shift+F gives โ",
    keys: "1234567890-=",
    passWpm: 20,
    passAcc: 95,
    text: `ๅ/-ภถุึคตจขช  ๅ/-ภถุึคตจขช
คน รถ ชื่อ ตลาด อ่าน เขียน เล่น
เขาอ่านหนังสือไทย
พูดไทยได้ไหม
คนเมืองกับคนบ้านนอก`
  },
  {
    id: "TH07",
    name: "Lesson  7   Thai Digits  ๐ ๑ ๒ ๓ ๔ ๕ ๖ ๗ ๘ ๙",
    focus: "Shift + the number row gives Thai digits: ๐ on Shift+Q, ๑-๔ on Shift+2-5, ๕-๙ on Shift+8-=. The 6 and 7 keys are ◌ุ/◌ู and ◌ึ/฿",
    keys: "shift q,2-5,8-=",
    passWpm: 18,
    passAcc: 95,
    text: `๐ ๑ ๒ ๓ ๔ ๕ ๖ ๗ ๘ ๙
๑๐ ๒๐ ๓๐ ๔๐ ๕๐ ๖๐ ๗๐ ๘๐ ๙๐
๑๐๐ ๑๐๐๐ ๒๕๖๓ ๙๙๙๙
ราคา ๒๕ บาท ๑๐๐ บาท
โทร ๐๒-๑๒๓-๔๕๖๗`
  },
  {
    id: "TH08",
    name: "Lesson  8   Punctuation  And  Latin Digits",
    focus: "Shift gives . , ? ( ) \" on the Thai keyboard. Latin digits come from the numeric keypad",
    keys: "shift+.,?()\"",
    passWpm: 21,
    passAcc: 95,
    text: `สวัสดีครับ คุณสบายดีไหม
"ไปไหน" "ไปตลาด"
โทร. 02-123-4567 เวลา ๙.๐๐ น.
ราคา 250 บาท ต่อ ๑ กิโล
ขอขอบคุณมากครับ`
  },
  {
    id: "TH09",
    name: "Lesson  9   Prose Drill  Technique",
    focus: "Continuous Thai prose. No spaces between words, one space between clauses",
    keys: "mixed",
    passWpm: 24,
    passAcc: 95,
    text: `การพิมพ์สัมผัสภาษาไทยต้องใช้สิบนิ้ว
วางนิ้วบนแถวกลาง ฟ ห ก ด และ า ส ว
กดตัวอักษรโดยไม่มองแป้นพิมพ์
ฝึกทุกวันวันละสิบนาทีความเร็วจะเพิ่มขึ้นเอง`
  },
  {
    id: "TH10",
    name: "Lesson 10   Prose Drill  Everyday",
    focus: "Longer text. Keep accuracy above ninety five percent",
    keys: "mixed",
    passWpm: 26,
    passAcc: 95,
    text: `วันนี้เป็นวันจันทร์อากาศดี
แม่ทำอาหารอร่อยพ่ออ่านหนังสือพิมพ์ทุกเช้า
น้องไปโรงเรียนกับเพื่อนโดยรถประจำทาง
ตอนเย็นทุกคนนั่งกินข้าวพร้อมกันที่บ้าน`
  }
];

var TH_TESTS = [
  {
    id: "TT01",
    name: "Test  1   การพิมพ์สัมผัส",
    text: `การพิมพ์สัมผัสภาษาไทยเป็นทักษะที่มีประโยชน์มาก ผู้เรียนควรวางนิ้วทั้งสองข้างไว้บนแถวกลางและกดตัวอักษรโดยไม่มองแป้นพิมพ์ เมื่อฝึกทุกวันวันละสิบนาทีความเร็วจะเพิ่มขึ้นเองโดยไม่ต้องเร่งมือให้ผิดพลาด การหยุดดูแป้นพิมพ์ทำให้เสียจังหวะและทำให้เกิดข้อผิดพลาดมากขึ้น`
  },
  {
    id: "TT02",
    name: "Test  2   จดหมายธุรกิจ",
    text: `เรียน คุณสมชาย ที่เคารพ บริษัทของเราจะส่งสินค้าจำนวน ๒๕๐ ชุด ไปยังสำนักงานของท่านภายในวันที่ ๕ เดือนมีนาคมนี้ ราคาทั้งหมดรวมค่าขนส่งแล้วเป็นเงิน ๔๑,๒๗๕ บาท โปรดตรวจสอบใบแจ้งหนี้ที่ส่งมาด้วย หากต้องการเปลี่ยนแปลงกำหนดส่งกรุณาแจ้งให้ทราบล่วงหน้า ขอแสดงความนับถือ`
  },
  {
    id: "TT03",
    name: "Test  3   ข่าว  And  Numbers",
    text: `กรมอุตุนิยมวิทยาแจ้งว่าช่วงสัปดาห์หน้ากรุงเทพมหานครจะมีอากาศร้อนและชื้น อุณหภูมิสูงสุดประมาณ ๓๘ องศาเซลเซียส ขอให้ประชาชนดื่มน้ำบ่อยๆ และหลีกเลี่ยงแสงแดดจัดในช่วงบ่าย ประชาชนริมแม่น้ำควรเฝ้าระวังระดับน้ำที่อาจสูงขึ้นหลังฝนตกหนักติดต่อกันสามวัน`
  },
  {
    id: "TT04",
    name: "Test  4   เรื่องสั้น",
    text: `นานมาแล้วมีชายคนหนึ่งอาศัยอยู่ริมป่า เขาปลูกข้าวและเลี้ยงควายทุกปี วันหนึ่งควายของเขาเดินหายไปเขาจึงออกตามหาทั้งวัน จนพลบค่ำเขาจึงพบควายของเขากำลังกินหญ้าอยู่ริมลำธาร เขาดีใจมากจึงจูงควายกลับบ้านและบอกกับทุกคนว่าพรุ่งนี้เขาจะปลูกหญ้าไว้ใกล้บ้านเพื่อควายจะได้ไม่ต้องเดินไกลอีก`
  }
];

TT.COURSES.th = {
  id: "th",
  name: "ไทย (Kedmanee)",
  layout: "th",
  lang: "th",
  lessons: TH_LESSONS,
  tests: TH_TESTS
};
