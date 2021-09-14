const Jimp = require('jimp');
const services = require('../data/services.js');
const STREAMER_LIST = [
  // HoloLivers
  '夏色まつり',
  'さくらみこ',
  '白銀ノエル',
  '湊あくあ',
  '不知火フレア',
  '潤羽るしあ',
  '癒月ちょこ',
  '宝鐘マリン',
  '大神ミオ',
  'ときのそら',
  '兎田ぺこら',
  '戌神ころね',
  'ロボ子さん',
  '百鬼あやめ',
  '星街すいせい',
  '猫又おかゆ',
  'AZKi',
  '大空スバル',
  '紫咲シオン',
  '赤井はあと',
  'アキロゼ',
  '白上フブキ',
  '夜空メル',
  '友人A',
  // Non-HoloLivers
  '犬山たまき'
];
const HEADER_HEIGHT = 100;
const CELL_HEIGHT = 260; // 260
const LINE_THICKNESS = 8;
const TIME_CELL_WIDTH = 440;
const SPACE_BETWEEN_STREAMS = 100;
const UPPER_PADDING = 30;
const MIN_WIDTH = 1520;
const BACKGROUND_COLOR = 0x3b7a2fff;
const HEADER_TIME_COLOR = 0x3b7a2fff;
const HEADER_SCHEDULE_COLOR = 0x3b7a2fff;
const LINE_COLOR = 0xffffffff;

exports.run = async (client, message, args, guildConfig) => {
  // Get the input from the arguments
  let input = args.join(' ');
  let schedule = toHashTable(input);
  // Transformation of the table into an image
  await tableToImage(schedule);
  message.channel.send('', {
    files: ['HoloSchedule.png']
  });
};

async function tableToImage(schedule) {
  // Initial Setup
  const font128 = await Jimp.loadFont(Jimp.FONT_SANS_128_WHITE);
  let finalWidth = 0;
  let finalHeight = 0;

  // Streams image creation
  for (let day in schedule) {
    finalHeight += HEADER_HEIGHT;
    let table = schedule[day];
    for (let key in table) {
      let streams = table[key];
      let width = TIME_CELL_WIDTH + LINE_THICKNESS + SPACE_BETWEEN_STREAMS;
      const streamerIconSize = CELL_HEIGHT - UPPER_PADDING * 2;
      const scaling = streamerIconSize / 200.0;

      // Stream image creation
      for (stream of streams) {
        const streamImage = await Jimp.read(stream['streamers'].length * streamerIconSize, CELL_HEIGHT, 0x00000000);
        let horizontalOffset = 0;
        for (streamer of stream['streamers']) {
          const streamerIcon = await Jimp.read(`resources/scheduleTwitter/${streamer}.png`);
          streamerIcon.resize(streamerIconSize, streamerIconSize); // Jimp.RESIZE_NEAREST_NEIGHBOR
          streamImage.blit(streamerIcon, horizontalOffset, UPPER_PADDING + LINE_THICKNESS);
          horizontalOffset += 191 * scaling;
        }
        let platforms = stream['platforms'];
        if (platforms.length > 0) {
          const platformsBG = await Jimp.read(`resources/scheduleTwitter/1-platform.png`);
          platformsBG.resize(streamerIconSize, streamerIconSize);
          streamImage.blit(platformsBG, horizontalOffset - 191 * scaling, UPPER_PADDING + LINE_THICKNESS);
          const platformIcon = await Jimp.read(`resources/scheduleTwitter/${platforms[0]}.png`);
          platformIcon.resize(streamerIconSize, streamerIconSize);
          streamImage.blit(platformIcon, horizontalOffset - 191 * scaling, UPPER_PADDING + LINE_THICKNESS);
          /**for (let i = 0; i < platforms.length; i++) {
            const platformIcon = await Jimp.read(`resources/scheduleTwitter/${platforms[i]}.png`);
            platformIcon.resize(streamerIconSize, streamerIconSize);
            streamImage.blit(
              platformIcon,
              horizontalOffset - 191 * scaling - (platforms.length - i - 1) * (26 * scaling),
              UPPER_PADDING + LINE_THICKNESS
            );
          }*/
        }
        stream['image'] = streamImage;
        width += streamImage.bitmap.width + SPACE_BETWEEN_STREAMS;
      }
      const streamsImage = await Jimp.read(width, CELL_HEIGHT + LINE_THICKNESS, 0x00000000);
      streamsImage.print(
        font128,
        0,
        LINE_THICKNESS, {
          text: key,
          alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
          alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE
        },
        TIME_CELL_WIDTH,
        CELL_HEIGHT
      );
      let horizontalOffset = TIME_CELL_WIDTH + LINE_THICKNESS + SPACE_BETWEEN_STREAMS;
      for (stream of streams) {
        streamsImage.blit(stream['image'], horizontalOffset, 0);
        horizontalOffset += stream['image'].bitmap.width + SPACE_BETWEEN_STREAMS;
      }
      finalWidth = streamsImage.bitmap.width > finalWidth ? streamsImage.bitmap.width : finalWidth;
      finalHeight += streamsImage.bitmap.height;
      streams['image'] = streamsImage;
    }
  }
  finalWidth = Math.max(MIN_WIDTH, finalWidth);
  //finalWidth = Math.max(finalHeight * 1.8, finalWidth);

  let image = await Jimp.read(finalWidth, finalHeight, BACKGROUND_COLOR);
  let verticalOffset = -1 * LINE_THICKNESS;
  for (let day in schedule) {
    let table = schedule[day];
    // Header creation
    const header = await Jimp.read(finalWidth, HEADER_HEIGHT, 0x00000000);
    await createHeader(header, day);

    // Final image creation
    const horizontalLine = await Jimp.read(finalWidth, LINE_THICKNESS, LINE_COLOR);
    const verticalLine = await Jimp.read(LINE_THICKNESS, finalHeight, LINE_COLOR);
    image.blit(horizontalLine, 0, verticalOffset);
    verticalOffset += LINE_THICKNESS;
    image.blit(header, 0, verticalOffset);
    verticalOffset += HEADER_HEIGHT;
    image.blit(verticalLine, TIME_CELL_WIDTH, 0);
    for (let key in table) {
      let streams = table[key];
      image.blit(horizontalLine, 0, verticalOffset);
      image.blit(streams['image'], 0, verticalOffset);
      verticalOffset += streams['image'].bitmap.height;
    }
  }

  return image.write('HoloSchedule.png');
}

async function createHeader(header, day) {
  const font64 = await Jimp.loadFont(Jimp.FONT_SANS_64_WHITE);
  const headerTime = await Jimp.read(TIME_CELL_WIDTH, HEADER_HEIGHT, HEADER_TIME_COLOR);
  const headerSchedule = await Jimp.read(
    header.bitmap.width - TIME_CELL_WIDTH - LINE_THICKNESS,
    HEADER_HEIGHT,
    HEADER_SCHEDULE_COLOR
  );
  header.blit(headerTime, 0, 0);
  header.blit(headerSchedule, TIME_CELL_WIDTH + LINE_THICKNESS, 0);
  header.print(
    font64,
    0,
    0, {
      text: 'Starting Hour',
      alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
      alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE
    },
    TIME_CELL_WIDTH,
    HEADER_HEIGHT
  );
  header.print(
    font64,
    TIME_CELL_WIDTH + LINE_THICKNESS,
    0, {
      text: 'Scheduled Streams (' + day + ')',
      alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
      alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE
    },
    header.bitmap.width - (TIME_CELL_WIDTH + LINE_THICKNESS),
    HEADER_HEIGHT
  );
}

function applyChanges(schedule, input) {
  let linesDelete = input.split('修正後')[0].split('\n');
  let linesAdd = input.split('修正後')[1].split('\n');
  let tableToAdd = schedule[Object.keys(schedule)[0]];
  for (let line of linesDelete) {
    for (let key in schedule) {
      let table = schedule[key];
      if (/^\d{1,2}:\d{2}/.test(line)) {
        let hour = getHourFromLine(line);
        let stream = lineToStream(line);
        let streams = table[hour];
        if (streams) {
          let oldLength = streams.length;
          table[hour] = streams.filter((s) => JSON.stringify(s) !== JSON.stringify(stream));
          if (table[hour].length !== oldLength) tableToAdd = table;
          if (table[hour].length === 0) delete table[hour];
        }
      }
    }
  }
  for (let line of linesAdd) {
    if (/^\d{1,2}:\d{2}/.test(line)) {
      let hour = getHourFromLine(line);
      let stream = lineToStream(line);
      if (!tableToAdd[hour]) tableToAdd[hour] = [];
      tableToAdd[hour].push(stream);
    }
  }
  return schedule;
}

function toHashTable(input) {
  let res = {};
  let lines = input.split('\n');
  let day = 'today';
  for (line of lines) {
    if (/[(（]\d{1,2}\/\d{1,2}[)）]/.test(line)) {
      day = /\d{1,2}\/\d{1,2}/.exec(line)[0];
      if (!res[day]) res[day] = {};
    }
    if (/^\d{1,2}:\d{2}/.test(line)) {
      let hour = getHourFromLine(line);
      let stream = lineToStream(line);
      if (!res[day][hour]) res[day][hour] = [];
      res[day][hour].push(stream);
    }
  }
  console.log(res);
  return res;
}

// We assume the line is well formated
function getHourFromLine(line) {
  let hour = /^\d{1,2}:\d{2}/.exec(line)[0].split(':');
  let hh = hour[0],
    mm = hour[1];
  if (hh.length === 1) hh = '0' + hh;
  if (mm.length === 1) mm = '0' + mm;
  hour = hh + ':' + mm;
  return hour;
}

// We assume the line is well formated
function lineToStream(line) {
  //We obtain the platforms the stream is happening on
  let platforms = [];
  if (/you/.test(line)) platforms.push('YouTube');
  if (/ニコニコ/.test(line) || /nico/.test(line)) platforms.push('NND');
  if (/bilibili/.test(line)) platforms.push('bilibili');
  if (/cluster/.test(line)) platforms.push('cluster');
  if (/reality/.test(line)) platforms.push('reality');

  // We obtain the streamers streaming at that hour
  let streamers = [];
  for (streamer of STREAMER_LIST) {
    if (line.search(streamer) >= 0) streamers.push(streamer);
  }

  // We now format and insert it into the result
  let stream = {
    streamers: streamers,
    platforms: platforms
  };
  return stream;
}