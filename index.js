const { access, mkdir } = require('fs');

const { exec } = require('child_process');

const output = './output';
access(
  output,
  err => {
    if (err) {
      mkdir(
        output,
        err => {
          if (err) {
            console.trace(err);
          }
        }
      );
    }
  }
);
console.log('The `output` directory is available!');

exec(
  'npm install',
  (err, stdout) => {
    if (err) {
      console.trace(err);
      return;
    }

    console.log('> npm install');
    console.log(stdout);
  }
);
