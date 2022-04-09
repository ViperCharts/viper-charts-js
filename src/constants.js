const MILLISECOND = 1;
const MILLISECOND100 = MILLISECOND * 100;
const SECOND = MILLISECOND * 1000;
const MINUTE = SECOND * 60;
const MINUTE5 = MINUTE * 5;
const MINUTE15 = MINUTE * 15;
const HOUR = MINUTE * 60;
const HOUR4 = HOUR * 4;
const HOUR12 = HOUR * 12;
const DAY = HOUR * 24;
const WEEK = DAY * 7;
const MONTH = WEEK * 4;
const YEAR = DAY * 365;

const TIMESCALES = [
  YEAR * 10,
  YEAR * 5,
  YEAR * 3,
  YEAR * 2,
  YEAR,
  MONTH * 6,
  MONTH * 4,
  MONTH * 3,
  MONTH * 2,
  MONTH,
  DAY * 15,
  DAY * 10,
  DAY * 7,
  DAY * 5,
  DAY * 3,
  DAY * 2,
  DAY,
  HOUR * 12,
  HOUR * 6,
  HOUR * 4,
  HOUR * 2,
  HOUR,
  MINUTE * 30,
  MINUTE * 15,
  MINUTE * 10,
  MINUTE * 5,
  MINUTE * 2,
  MINUTE,
  SECOND * 30,
  SECOND * 15,
  SECOND * 10,
  SECOND * 5,
  SECOND * 2,
  SECOND,
  MILLISECOND * 500,
  MILLISECOND * 250,
  MILLISECOND * 100,
  MILLISECOND * 50,
  MILLISECOND,
];

const TIMEFRAMES = {
  ms: MILLISECOND,
  s: SECOND,
  m: MINUTE,
  h: HOUR,
  d: DAY,
  w: WEEK,
  mo: MONTH,
  y: YEAR,
};

const MONTHS = [
  {
    short: "Jan",
    long: "January",
  },
  {
    short: "Feb",
    long: "February",
  },
  {
    short: "Mar",
    long: "March",
  },
  {
    short: "Apr",
    long: "April",
  },
  {
    short: "May",
    long: "May",
  },
  {
    short: "Jun",
    long: "June",
  },
  {
    short: "Jul",
    long: "July",
  },
  {
    short: "Aug",
    long: "August",
  },
  {
    short: "Sep",
    long: "September",
  },
  {
    short: "Oct",
    long: "October",
  },
  {
    short: "Nov",
    long: "November",
  },
  {
    short: "Dec",
    long: "December",
  },
];

function getTimeframeText(timeframe) {
  const keys = Object.keys(TIMEFRAMES);
  for (let i = 0; i < keys.length; i++) {
    if (timeframe / TIMEFRAMES[keys[i]] < 1) {
      const key = keys[i - 1];
      return `${timeframe / TIMEFRAMES[key]}${key}`;
    }
  }
}

export default {
  MILLISECOND,
  MILLISECOND100,
  SECOND,
  MINUTE,
  MINUTE5,
  MINUTE15,
  HOUR,
  HOUR4,
  HOUR12,
  DAY,
  WEEK,
  MONTH,
  YEAR,
  TIMESCALES,
  TIMEFRAMES,
  MONTHS,
  getTimeframeText,
};
