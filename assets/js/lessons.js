/* Typing Tutor - course registry and English (QWERTY) lesson data */
window.TT = window.TT || {};
TT.COURSES = TT.COURSES || {};

var EN_LESSONS = [
  {
    id: "L01",
    name: "Lesson  1   Home Row  A S D F  J K L ;",
    focus: "Keys: a s d f j k l ;   -   keep fingers on the home row, do not look down",
    keys: "asdfjkl;",
    passWpm: 12,
    passAcc: 95,
    text: `asdf jkl; asdf jkl; ;lkj fdsa
aa ss dd ff jj kk ll ;; as as jk jk
sad lad dad ass add all fall ask
flask salad lass lads dads alas`
  },
  {
    id: "L02",
    name: "Lesson  2   Home Row  Words",
    focus: "Words made from home-row keys only. Rhythm: steady left, steady right",
    keys: "asdfjkl;",
    passWpm: 15,
    passAcc: 95,
    text: `add a salad add a salad add
a lass falls as dads ask all
lads dads flask alas fall ask
ask a lass a flask alas`
  },
  {
    id: "L03",
    name: "Lesson  3   Home Row  G H",
    focus: "Keys: g h   -   index fingers reach, then return to f and j",
    keys: "asdfghjkl;",
    passWpm: 16,
    passAcc: 95,
    text: `fgjh dfgh fgjh dfgh gg hh gg hh
had has hag lag sag shag glad
a dash a lash a flag a glass
half hall shall flash glass had`
  },
  {
    id: "L04",
    name: "Lesson  4   Top Row  Q W E R T  Y U I O P",
    focus: "Top row. Reach up from the home row, snap back down",
    keys: "qwertyuiopasdfjkl;",
    passWpm: 18,
    passAcc: 95,
    text: `qwer tyui op qwer tyui op
the her here there where why
quiet quite white write your
power tower river water over`
  },
  {
    id: "L05",
    name: "Lesson  5   Bottom Row  Z X C V B  N M",
    focus: "Bottom row. Do not move the whole hand - one finger only",
    keys: "abcdefghijklmnopqrstuvwxyz",
    passWpm: 20,
    passAcc: 95,
    text: `zxcv bn m zxcv bn m zz xx cc vv
box fox mix six tax wax exam zoom
comb bomb numb envy zany bronze
when the river runs over the box`
  },
  {
    id: "L06",
    name: "Lesson  6   All Keys  Review",
    focus: "Full alphabet drills - pangrams cover every key",
    keys: "abcdefghijklmnopqrstuvwxyz",
    passWpm: 22,
    passAcc: 95,
    text: `the quick brown fox jumps over the lazy dog
sphinx of black quartz judge my vow
pack my box with five dozen liquor jugs
how vexingly quick daft zebras jump`
  },
  {
    id: "L07",
    name: "Lesson  7   Capitals  Shift Keys",
    focus: "Shift with the opposite hand from the letter key",
    keys: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    passWpm: 22,
    passAcc: 95,
    text: `Aa Bb Cc Dd Ee Ff Gg Hh Ii Jj Kk Ll Mm
Nn Oo Pp Qq Rr Ss Tt Uu Vv Ww Xx Yy Zz
MARY HAD A LITTLE LAMB ITS FLEECE WAS WHITE
Ada Sam Dan Jo Kim Hal Pat Sue Tom Ben`
  },
  {
    id: "L08",
    name: "Lesson  8   Numbers  And  Symbols",
    focus: "Number row and shifted symbols. Pinky keys: - = [ ] \\ ; ' , . /",
    keys: "0123456789-=[]\\;',./",
    passWpm: 20,
    passAcc: 95,
    text: `1! 2@ 3# 4$ 5% 6^ 7& 8* 9( 0)
123 456 789 0 1024 3.14159 2.71828
- = _ + [ ] { } ( ) < > / \\ |
555 010 2030  #42  $99.95  100%`
  },
  {
    id: "L09",
    name: "Lesson  9   Punctuation  And  Quotes",
    focus: "Apostrophe, quotes, commas, question marks - do not pause for them",
    keys: ".,;:'\"?!-()",
    passWpm: 24,
    passAcc: 95,
    text: `it's a test. is it? yes, no; maybe!
"Where are you going?" asked Sam.
"I'm not sure," she said, "but it's late."
Note: call (555) 010-2030 before 4 p.m.`
  },
  {
    id: "L10",
    name: "Lesson 10   Prose  Drills",
    focus: "Continuous prose. Build speed without dropping accuracy",
    keys: "mixed",
    passWpm: 28,
    passAcc: 95,
    text: `Practice a little every day. Speed follows
accuracy, never the other way around. Keep
your eyes on the screen and trust your
fingers to find the keys they already know.`
  }
];

var EN_TESTS = [
  {
    id: "T01",
    name: "Test  1   Standard Alphabet",
    text: `The quick brown fox jumps over the lazy dog while the five boxing wizards jump quickly. Sphinx of black quartz, judge my vow. Pack my box with five dozen liquor jugs. How vexingly quick daft zebras jump. Jackdaws love my big sphinx of quartz. Bright vixens jump; dozy fowl quack. Quick zephyrs blow, vexing daft Jim. Two driven jocks help fax my big quiz. The wave of the quick brown fox swept the dock and the lazy dog ran home to rest, and nobody blamed him for it.`
  },
  {
    id: "T02",
    name: "Test  2   Business Letter",
    text: `Dear Ms. Alvarez, Thank you for your letter of March 14 regarding the order of 250 keyboard stands. We are pleased to confirm that the shipment will leave our warehouse on April 2 and should reach your office within five working days. The total cost, including freight and the 8% handling charge, is $4,127.50. Please review the attached invoice and let us know if any part of the delivery schedule needs to be changed. We appreciate your continued business and remain at your service for any further questions. Yours sincerely, J. Whitfield, Sales Manager.`
  },
  {
    id: "T03",
    name: "Test  3   Technical Passage",
    text: `A keyboard encoder scans the key matrix in columns and rows, debounces the contacts for about 5 ms, and reports a scancode to the host. The driver maps that scancode to a keysym, applies the shift, control and alt modifiers, and delivers a character event to the application. Because the scan cycle runs roughly every 10 ms, a typist moving at 120 words per minute produces a key press about every 250 ms, which leaves the controller plenty of time to detect both the press and the release without losing any keystrokes.`
  },
  {
    id: "T04",
    name: "Test  4   Literary Passage",
    text: `It was a pleasure to bargain, said the shopkeeper, for nothing could be more entertaining than the price of things. The boy counted the coins twice, set them on the counter, and asked whether the machine would work in the dark. It will work, the man said, in the dark and in the rain, but it will not work if you look at your hands. That is the only rule. Look at the page, not at the keys. The fingers know the way better than the eyes ever did, and they have been walking that road for twenty years without once losing their place.`
  }
];

TT.COURSES.en = {
  id: "en",
  name: "English",
  layout: "us",
  lang: "en",
  lessons: EN_LESSONS,
  tests: EN_TESTS
};

TT.courseId = "en";
TT.LESSONS = EN_LESSONS;
TT.TESTS = EN_TESTS;

/* switch the active course; also selects the matching keyboard layout */
TT.setCourse = function (id) {
  var c = TT.COURSES[id] || TT.COURSES.en;
  TT.courseId = c.id;
  TT.LESSONS = c.lessons;
  TT.TESTS = c.tests;
  if (TT.setLayout) TT.setLayout(c.layout);
  return c;
};
TT.active = function () { return TT.COURSES[TT.courseId]; };
