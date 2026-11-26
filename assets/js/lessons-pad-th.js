/* Typing Tutor - Gamepad Thai course (Typing_TH profile).
 * The Kedmanee alphabet ordered by the gamepad grid instead of keyboard rows:
 * base face row (ร น ก อ ง ม, nothing held), then one held row per lesson -
 * LB and RB consonants, LT vowel signs, RT long/pre-posed vowels, the RB+RT
 * tone marks - before the two-hold consonant pairs, the three-hold rarities
 * and the two-hold Thai-digit / punctuation rows. Every exercise uses only
 * slots introduced up to that point. UI stays English, exercises are Thai. */
window.TT = window.TT || {};

var PAD_TH_LESSONS = [
  {
    id: "TP01",
    name: "Lesson  1   Tap Row  ร น ก อ ง ม",
    focus: "Nothing held: tap A B X Y Start Guide with the right thumb. ร=A, น=B, ก=X, อ=Y, ง=Start, ม=Guide",
    keys: "ร น ก อ ง ม",
    passWpm: 5,
    passAcc: 95,
    text: `ร น ก อ ง ม  ม ง ก อ น ร
นก กก งก อก อน อม
มอง นอน ออก นอก กรอก
กรม นม มอง นอน
นกมอง ออกนอก นอนมอง`
  },
  {
    id: "TP02",
    name: "Lesson  2   LB Row  ย ว ท ด ล ต",
    focus: "Hold LB with the left index, tap the face keys with the thumb: ย ว ท ด ล ต = A B X Y Start Guide",
    keys: "ย ว ท ด ล ต",
    passWpm: 7,
    passAcc: 95,
    text: `ย ว ท ด ล ต  ท ด ล ต ย ว
ลม ลด วน วง  ดวง ลวด
ยอด วัด นวด มด  ทน วน
นวล ทด ทยอย  มดลม วงดวง
ยอดนวด ลดลวด ทนทยอย`
  },
  {
    id: "TP03",
    name: "Lesson  3   RB Row  ห ส บ ค ป จ",
    focus: "Hold RB with the right index: ห ส บ ค ป จ = A B X Y Start Guide. Release the face key before the shoulder",
    keys: "ห ส บ ค ป จ",
    passWpm: 9,
    passAcc: 95,
    text: `ห ส บ ค ป จ  หส บค ปจ
บน จบ จน คน  ปม บด ปก
หมด หนวด หน  สด สอน
สงบสอดส่อง หมดจบบนปก
สอนคนหมดจด บนปกหมดจด`
  },
  {
    id: "TP04",
    name: "Lesson  4   LT Row  ◌ะ ◌ั ◌ี ◌ิ ◌ึ ◌ื",
    focus: "Hold LT: the attached vowel signs ◌ะ ◌ั ◌ี ◌ิ ◌ึ ◌ื = A B X Y Start Guide. Type marks right after the consonant",
    keys: "ะ ั ี ิ ึ ื",
    passWpm: 10,
    passAcc: 95,
    text: `ะ ั ี ิ ึ ื  ะะ ิิ ึึ
กิน คิด ปิด  วัน มัน สี
ลึก คือ มือ  ดึก หิน ดิน
นิด ตี ปี กะทะ  ปิดกินวัน
มือคือลึก ปิดคิดกินสี`
  },
  {
    id: "TP05",
    name: "Lesson  5   RT Row  ◌า ◌ำ เ แ โ ใ",
    focus: "Hold RT: long and pre-posed vowels ◌า ◌ำ เ แ โ ใ = A B X Y Start Guide. Pre-vowels are typed before the consonant",
    keys: "า ำ เ แ โ ใ",
    passWpm: 12,
    passAcc: 95,
    text: `า ำ เ แ โ ใ  มา นา ตา
พา หา เรา เสา เตา เงิน
ทำ ดำ แมว สวย เบา เมา
เวลา เรียน โรงเรียน ตามมา
เราทำนา แมวสวย มาหาเรา`
  },
  {
    id: "TP06",
    name: "Lesson  6   Tone Marks  RB+RT  ◌่ ◌้ ◌๊ ◌๋ ◌์ ◌็",
    focus: "Hold RB and RT together: the tone marks ◌่ ◌้ ◌๊ ◌๋ and ◌์ ◌็ = A B X Y Start Guide",
    keys: "่ ้ ๊ ๋ ์ ็",
    passWpm: 13,
    passAcc: 95,
    text: `่ ้ ๊ ๋ ์ ็  ก่อน น้ำ
ใหม่ เดิน เห็น  เหลือง เด็ก
สัตว์ก่อนน้ำ  เดินเห็นใหม่
เหลืองเด็กน้ำ เห็นก่อนใหม่เดิน
สัตว์เดินก่อน เห็นน้ำเหลือง`
  },
  {
    id: "TP07",
    name: "Lesson  7   Two Hold Consonants  พ ข ช ธ ผ ศ ถ ณ ซ ษ ญ ภ",
    focus: "RB+LT gives พ ข ช ธ ผ ศ, LB+RT gives ถ ณ ซ ษ ญ ภ - two fingers held, thumb taps",
    keys: "พ ข ช ธ ผ ศ ถ ณ ซ ษ ญ ภ",
    passWpm: 14,
    passAcc: 95,
    text: `พ ข ช ธ ผ ศ  ถ ณ ซ ษ ญ ภ
ขา ขาย ใจ  เขียน พบ
ช้า ผัก เข็ม  ซื่อ ถ้วย ถอย
ผอมขาวสอนเขียน  พบใจช้าขาย
ศึกษาใจเรา เขียนช้าขายของ`
  },
  {
    id: "TP08",
    name: "Lesson  8   Three Hold Rows  ◌ุ ◌ู ไ ฝ ฎ ฏ ฬ ฤ",
    focus: "Three fingers held: RB+LT+RT gives ◌ุ ◌ู ไ, LB+RB+LT the ฝ ฏ ฎ row, LB+LT+RT the ฤ row. Rare letters pay the triple tax",
    keys: "ุ ู ไ ฝ ฎ ฏ ฤ ฬ ฆ ฌ",
    passWpm: 15,
    passAcc: 95,
    text: `ุ ู ไ  ฝ ฎ ฏ ฬ ฤ
ดู ไป ไม้  ไทย ไก่ สูง
สุข หยุด ผู้  ฤดู ฝน ฝนตก
ผู้หญิงดูฝนตก ไปดูไม้ไทย
หยุดสูงสุข ฤดูฝนหยุด`
  },
  {
    id: "TP09",
    name: "Lesson  9   Thai Digits And  Punctuation",
    focus: "LB+RB gives ๐-๕, LB+LT gives ๖-๙ ฿ ๅ; comma, period, quotes, question and brackets sit on LT+RT",
    keys: "๐-๙ , . \" ? ( )",
    passWpm: 12,
    passAcc: 95,
    text: `๐ ๑ ๒ ๓ ๔ ๕  ๖ ๗ ๘ ๙  ๅ ฿
นก ๒ ตัว แมว ๓ ตัว
ราคา ๒๕ บาท รวม ๑๐๐ บาท
หนังสือ ๒ เล่ม ดินสอ ๓ แท่ง
ไปไหน? ไปตลาด ใช่หรือผิด
"ไปไหน" "ไปตลาด"`
  },
  {
    id: "TP10",
    name: "Lesson 10   Prose Review",
    focus: "Continuous Thai across every row. Words run together; a space separates clauses. Hold first, tap second",
    keys: "mixed",
    passWpm: 16,
    passAcc: 95,
    text: `วันนี้เราไปโรงเรียน
แม่ทำอาหาร พ่ออ่านหนังสือพิมพ์
น้องไปตลาดกับเพื่อนทุกเย็น
ทุกคนกินข้าวพร้อมกันที่บ้านอย่างสุข
ฝึกทุกวันความเร็วจะเพิ่มขึ้นเอง`
  }
];

var PAD_TH_TESTS = [
  {
    id: "TPT01",
    name: "Test  1   ชีวิตประจำวัน",
    text: `ทุกเช้าพ่อตื่นแต่เช้าเพื่อดูแลต้นไม้ในสวน แม่ทำอาหารเช้าให้เราสามคนกินพร้อมกันก่อนไปโรงเรียน เราชอบไข่และกาแฟแต่น้องชอบข้าวเหนียวไก่ย่างและน้ำหวาน`
  },
  {
    id: "TPT02",
    name: "Test  2   จดหมายธุรกิจ",
    text: `เรียนคุณสมชาย ขอบคุณสำหรับหนังสือที่ส่งมา ราคา ๒๕๐ บาทนั้นแพงเกินไป เราขอซื้อเพียง ๑๐๐ ฉบับ โปรดยืนยันภายใน ๕ วัน ขอแสดงความนับถือ สมศักดิ์`
  },
  {
    id: "TPT03",
    name: "Test  3   ข่าว",
    text: `ข่าวเมื่อคืนนี้ ฝนตกหนักทั้งเมืองนานสามชั่วโมง รถเคลื่อนได้ช้ามาก น้ำท่วมถนนหลายสาย ประชาชนควรอยู่ที่บ้านถ้าไม่จำเป็น และขับรถช้า ๆ ระวังน้ำท่วมขัง`
  },
  {
    id: "TPT04",
    name: "Test  4   เรื่องสั้น",
    text: `นานมาแล้วมีชายคนหนึ่งอาศัยอยู่ริมป่า เขาปลูกข้าวและเลี้ยงควายทุกปี วันหนึ่งควายของเขาเดินหายไปเขาจึงออกตามหาทั้งวัน จนพลบค่ำเขาจึงพบควายของเขากำลังกินหญ้าอยู่ริมลำธาร เขาดีใจมากจึงจูงควายกลับบ้านและบอกกับทุกคนว่าพรุ่งนี้เขาจะปลูกหญ้าไว้ใกล้บ้าน`
  }
];

TT.COURSES["th-pad"] = {
  id: "th-pad",
  name: "Gamepad ไทย",
  layout: "th",
  lang: "th",
  css: "course-th",
  pad: "th",
  lessons: PAD_TH_LESSONS,
  tests: PAD_TH_TESTS
};
