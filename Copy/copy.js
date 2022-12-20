import clipboard from 'clipboardy';
const myArgs = process.argv.slice(2);
clipboard.writeSync(myArgs[0]);