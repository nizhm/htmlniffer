const { appendFileSync } = require('fs');
const path = require('path');

const outputTarget = `${__dirname}/../../output/logger.log`;

const logger = str => {
  const msg = `\n[${new Date().toLocaleString()}] ` + str;
  console.log(msg);
  setTimeout(
    () => {
      appendFileSync(
        outputTarget,
        msg,
        'utf8',
        err => { if (err) { console.trace(err); } }
      );
    }
  );
};

module.exports = {
  logger
}
