function InputStream(input) {
  let pos = 0;
  let line = 1;
  let col = 0;

  // Get the next character and iterate lines
  const next = () => {
    let ch = input.charAt(pos++);
    if (ch === "\n") {
      line++;
      col = 0;
    } else {
      col++;
    }
    return ch;
  };

  // Look at character
  const peek = () => input.charAt(pos);

  // Check if end of file
  const endOfFile = () => peek() === "";

  // Throw new error
  const croak = (msg) => {
    throw new Error(`${msg} (${line}:${col})`);
  };

  const isKeyword = (char) => ["if", "else", "true", "false"].includes(char);
  const isDigit = (char) => /[0-9]/i.test(char);
  const isIdStart = (char) => /[a-z_]/i.test(char);
  const isId = (char) => isIdStart(char) || "?!-<>=0123456789".includes(char);
  const isOperator = (char) => "+-*/%=&|<>!".includes(char);
  const isPunc = (char) => ",;(){}[]".includes(char);
  const isWhitespace = (char) => " \t\n".includes(char);

  // Run a conditional check until its true
  const readWhile = (predicate) => {
    let str = "";
    while (!input.endOfFile() && predicate(input.peek())) {
      str += input.next();
    }
    return str;
  };

  // Parse a number with up to one decimal place
  const readNumber = () => {
    let hasDot = false;
    let number = readWhile((char) => {
      if (char === ".") {
        if (hasDot) return false;
        hasDot = true;
        return true;
      }
      return isDigit(char);
    });
    return { type: "num", value: parseFloat(number) };
  };

  const readId = () => {
    const id = readWhile(isId);
  };

  const readEscaped = (end) => {
    let escaped = false;
    let str = "";
    input.next();
    while (!input.endOfFile()) {
      let char = input.next();
      if (escaped) {
        str += char;
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (ch === end) {
        break;
      } else {
        str += char;
      }
    }
    return str;
  };

  const readString = () => ({ type: "str", value: readEscaped('"') });

  // If comment is found, loop past all its characters till a new line is found
  const skipComment = () => {
    readWhile((ch) => ch != "\n");
    input.next();
  };

  const isComment = () => peek() === "#";

  const readNext = () => {
    // Skip whitespace
    readWhile(isWhitespace);
    // End if end of file
    if (input.endOfFile()) return null;

    // Get next character
    let char = input.peek();

    // If char is a comment
    if (isComment) {
      skipComment();
      return readNext();
    }
    if (char === '"') return readString();
    if (isDigit(char)) return readNumber();
    if (isIdStart(char)) return readIdent();
    if (isPunc(char)) return { type: "punc", value: input.next() };
    if (isOperator(char)) return { tyoe: "op", value: readWhile(isOperator) };

    input.croak("Can't handle character: " + char);
  };

  return {
    next,
    peek,
    endOfFile,
    croak: input.croak,
  };
}

// (^*/+-
const str = "1 + 3 * 6 / 7 - 1 - 3";

const evalTokens = (tokens) => {
  // Evaluate right to left
  // Search for
  const operators = "-+/*";

  if (tokens.length === 1 && tokens[0].type === "number") {
    return tokens[0];
  }

  for (let i = 0; i < operators.length; i++) {
    const operator = operators[i];
    for (let j = tokens.length - 1; j >= 0; j--) {
      const token = tokens[j];
      if (token.type === "operator" && token.value === operator) {
        // Add method to tree with left and right

        return {
          type: operator,
          args: [
            evalTokens(tokens.slice(0, j)),
            evalTokens(tokens.slice(j + 1, tokens.length)),
          ],
        };
      }
    }
  }
};

const isOperator = (char) => "/*+-".includes(char);
const isWhitespace = (char) => " \t\n".includes(char);
const isDigit = (char) => /[0-9]/i.test(char);

const tokens = [];

function buildTokens(str) {
  let pos = 0;

  do {
    const char = str[pos];
    if (isWhitespace(char)) {
      pos++;
      continue;
    }

    // If is digit
    if (isDigit(char)) {
      tokens.push({
        type: "number",
        value: parseFloat(char),
      });
      pos++;
      continue;
    }

    // If is operator
    if (isOperator(char)) {
      tokens.push({
        type: "operator",
        value: char,
      });
      pos++;
      continue;
    }
  } while (pos < str.length);
}

buildTokens(str);
console.log(JSON.stringify(evalTokens(tokens)));
