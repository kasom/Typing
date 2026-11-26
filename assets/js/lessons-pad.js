/* Typing Tutor - Gamepad English course.
 * Same alphabet as the QWERTY course, ordered by the JK "Typing" gamepad
 * profile instead of keyboard rows: the base face row (e t a o i n, nothing
 * held) first, then one held-finger row per lesson (LB, RB, LT, RT), capitals
 * via L3, and the two-trigger digit/punctuation rows last. Every exercise
 * uses only slots introduced up to that point. */
window.TT = window.TT || {};

var PAD_EN_LESSONS = [
  {
    id: "EP01",
    name: "Lesson  1   Tap Row  e t a o i n",
    focus: "Nothing held: tap A B X Y Start Guide with the right thumb. e=A, t=B, a=X, o=Y, i=Start, n=Guide",
    keys: "e t a o i n",
    passWpm: 5,
    passAcc: 95,
    text: `e t a o i n  n i o a t e  t e i o n a
at it an on no to in
ten net ton tan tin not
tea eat ate tea tone note none
anti onion titan nation notation
ten ten tone note no no not into`
  },
  {
    id: "EP02",
    name: "Lesson  2   LB Row  s r h l d c",
    focus: "Hold LB with the left index, tap the face keys with the thumb: s r h l d c = A B X Y Start Guide",
    keys: "s r h l d c",
    passWpm: 7,
    passAcc: 95,
    text: `as has had and  is his this
the these then than  three tree
her here there  shirt short
as sad said  sand land hand hold old
nine line rain chair dance
children orchard  cold hold sold told`
  },
  {
    id: "EP03",
    name: "Lesson  3   RB Row  u m f p g w",
    focus: "Hold RB with the right index: u m f p g w = A B X Y Start Guide. Release the face key before the shoulder",
    keys: "u m f p g w",
    passWpm: 9,
    passAcc: 95,
    text: `up us use  sum fun gun run
much such cut nut  mug gum plum drum
we new few now how low
come some home from  time wine nine
woman human mouse house
world word wrong ground  snow flow grow`
  },
  {
    id: "EP04",
    name: "Lesson  4   LT Row  y b v k j x",
    focus: "Hold LT with the left middle finger (or index): y b v k j x = A B X Y Start Guide",
    keys: "y b v k j x",
    passWpm: 11,
    passAcc: 95,
    text: `by yet yes you they
your very year just like
big dig back jack box tax six mix
know look book took line nine
job joy voice change love life
over never very  they your year`
  },
  {
    id: "EP05",
    name: "Lesson  5   RT Row  q z  Full Alphabet",
    focus: "Hold RT with the right middle finger: q z = A B. Every letter is on a single hold now - the pangrams prove it",
    keys: "q z",
    passWpm: 12,
    passAcc: 95,
    text: `quiz queen keen quiet quite
zoo zero zone zebra amazing puzzle
the quick brown fox jumps over the lazy dog
sphinx of black quartz judge my vow
pack my box with five dozen liquor jugs
how vexingly quick daft zebras jump`
  },
  {
    id: "EP06",
    name: "Lesson  6   Capitals  Hold L3",
    focus: "Capitals: hold L3 (left stick click) with the left thumb, then the row combo, then tap the face key",
    keys: "L3 shift",
    passWpm: 11,
    passAcc: 95,
    text: `I A O  A I O I
Tom Tim Dan Kim  Ann Amy May Joe Bob
June July April  Sun Moon
Sunday Monday Friday
John met Mary at the old church.
The sun rose over the town.`
  },
  {
    id: "EP07",
    name: "Lesson  7   Digits And  Punctuation",
    focus: "Digits are two-finger rows: LB+RB gives 1-6, LB+LT gives 7 8 9 0. Comma, period, slash sit on LT+RT",
    keys: "0123456789 , . /",
    passWpm: 10,
    passAcc: 95,
    text: `1 2 3 4 5 6  6 5 4 3 2 1
7 8 9 0 - =  0 9 8 7 6 5
12 34  56 78  90 100 250 1999
yes, no.  end. wait? no?
one, two, three.  four, five, six.
time is 9. call me at five.`
  },
  {
    id: "EP08",
    name: "Lesson  8   All Rows  Prose",
    focus: "Continuous prose across every row. Hold the combo first, tap the face second, keep accuracy above 95",
    keys: "mixed",
    passWpm: 14,
    passAcc: 95,
    text: `the weather was cold but the sun made
the garden green. they walked over the
bridge and came back by the old stone road.
please take these five books and put them
on the big desk now. practise a little every
day: speed follows accuracy, never the other way.`
  }
];

var PAD_EN_TESTS = [
  {
    id: "ET01",
    name: "Test  1   Common Words",
    text: `The people of the town came to the old market early in the morning. They carried food and water, and the children ran between the women and the men. It was a good time to be alive, and no one wanted to go home before the sun went down over the river.`
  },
  {
    id: "ET02",
    name: "Test  2   Work And Play",
    text: `Please send the report before Monday. The team will review the numbers, fix the errors in the second column, and call a meeting when the plan is ready. After work some of us are going to the game. You should come with us: we always have fun when we are together.`
  },
  {
    id: "ET03",
    name: "Test  3   Numbers And Marks",
    text: `The order was for 250 boxes, 30 drums and 12 cases of ink, at 4.50 each. The total is 1,350.75. Send half on June 3 and the rest by June 10. Is that possible? If the date must move, please say so now, not after the first truck is loaded.`
  },
  {
    id: "ET04",
    name: "Test  4   A Little Story",
    text: `Once upon a time a quiet farmer found a small box under an old tree. Inside the box there was nothing but a key. He took the key home, and every night he held it up to the light. Years later, when he was an old man himself, he walked to the far side of the hill and opened a door that no one in the town had ever seen.`
  }
];

TT.COURSES["en-pad"] = {
  id: "en-pad",
  name: "Gamepad English",
  layout: "us",
  lang: "en",
  css: "",
  /* which TT.PADMAPS entry drives the controller view for this course */
  pad: "en",
  lessons: PAD_EN_LESSONS,
  tests: PAD_EN_TESTS
};
