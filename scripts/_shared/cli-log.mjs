function writeLine(stream, message = '') {
  stream.write(`${message}\n`);
}

/** Raw line to stdout (for scripts with custom format e.g. [PASS], [FAIL]) */
export function log(message = '') {
  writeLine(process.stdout, message);
}

export function info(message = '') {
  writeLine(process.stdout, `[INFO] ${message}`);
}

export function success(message = '') {
  writeLine(process.stdout, `[OK] ${message}`);
}

export function warn(message = '') {
  writeLine(process.stderr, `[WARN] ${message}`);
}

export function error(message = '') {
  writeLine(process.stderr, `[ERROR] ${message}`);
}

export function detail(message = '') {
  writeLine(process.stderr, `  - ${message}`);
}

export function printErrorLines(header, lines) {
  error(header);
  for (const line of lines) {
    detail(line);
  }
}
