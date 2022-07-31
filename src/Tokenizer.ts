import { SaeSyntaxError } from './Error'

export interface TokenDetails {
  token?: Token;
  line: number;
  column: number;
  file: string;
  errorHint: string;
}

export interface Token {
  type: string;
  value: any;
  up?: TokenDetails;
}

/**
 * Tokenizer spec.
 */
const Spec: [RegExp, string | null][] = [
  [/^\s+/, null], // whitespace
  [/^\/\/.*/, null], // comments //
  [/^\/\*[\s\S]*?\*\//, null], // multiline comments /* */

  // Boolean operators
  [/^[\>\<]=?/, 'relational_operator'],
  [/^[\=\!]=/, 'equality_operator'],
  [/^\&\&/, 'logical_and_operator'],
  [/^\|\|/, 'logical_or_operator'],
  [/^\!\|\|/, 'logical_misc_operator'], // nor
  [/^\!\&\&/, 'logical_misc_operator'], // nand
  [/^\~\&\&/, 'logical_misc_operator'], // xand
  [/^\~\|\|/, 'logical_misc_operator'], // xor

  // Symbols

  [/^\{/, '{'],
  [/^\}/, '}'],
  [/^\(/, '('],
  [/^\)/, ')'],
  [/^\[/, '['],
  [/^\]/, ']'],
  [/^\./, '.'],
  [/^;/, ';'],
  [/^,/, ','],

  [/^=/, 'simple_assign'],
  [/^[\*\/\+\-]=/, 'complex_assign'],

  [/^let mut/, 'let_mut'],
  [/^let/, 'let'],

  // Keywords
  [/^if/, 'if'],
  [/^else/, 'else'],
  [/^return/, 'return'],
  [/^take/, 'take'],
  [/^fn/, 'fn'],
  [/^defer/, 'defer'],
  [/^fire/, 'fire'],
  [/^loop over/, 'loop_over'],
  [/^loop/, 'loop'],
  [/^as/, 'as'],
  [/^break/, 'break'],
  [/^continue/, 'continue'],
  [/^use/, 'use'],
  [/^pub/, 'pub'],

  [/^i8/, 'primitive'],
  [/^i16/, 'primitive'],
  [/^i32/, 'primitive'],
  [/^i64/, 'primitive'],
  [/^i128/, 'primitive'],
  [/^u8/, 'primitive'],
  [/^u16/, 'primitive'],
  [/^u32/, 'primitive'],
  [/^u64/, 'primitive'],
  [/^u128/, 'primitive'],
  [/^u128/, 'primitive'],
  [/^f32/, 'primitive'],
  [/^f64/, 'primitive'],
  [/^bool/, 'primitive'],
  [/^str/, 'primitive'],

  // Math
  [/^[+\-]/, 'additive_operator'],
  [/^[*\/]/, 'multiplicative_operator'],

  // Numbers
  [/^\d+/, 'number'],

  // Bools
  [/^false/, 'bool'],
  [/^true/, 'bool'],

  // Strings
  [/^"[^"]*"/, 'string'],
  [/^'[^']*'/, 'string'],

  // Types
  [/^type struct/, 'type_struct'],
  [/^type interface/, 'type_interface'],
  [/^type alias/, 'type_alias'],
  [/^impl/, 'impl'],

  // C++ native code
  [/^exposing/, 'exposing'],
  [/^\$C\+\+\s*\(([\S\s]*)\)\s*exposing/, 'cpp_code'],
  // Identifiers
  [/^[_a-zA-Z][_a-zA-Z0-9]*/, 'identifier']
];

/**
 * Tokenizer class.
 *
 * Lazily pulls a token from a stream.
 */
export class Tokenizer {
  _string: string;
  _cursor: number;
  _file: string;

  /**
   * Initializes the string.
   */
  init(str: string) {
    this._string = str;
    this._cursor = 0;
  }

  /**
   * Whther the tokenizer reached EOF.
   */
  isEOF(): boolean {
    return this._cursor === this._string.length;
  }

  /**
   * Whether we still have more tokens.
   */
  hasMoreTokens(): boolean {
    return this._cursor < this._string.length && this._string.substring(this._cursor).trim().length !== 0;
  }

  _match(regexp: RegExp, str: string): string | null {
    const matched = regexp.exec(str);
    if (matched == null) {
      return null;
    }

    if (str.startsWith('$C++(')) {
      this._cursor += matched[0].length - "exposing".length;
      return matched[1];
    }

    this._cursor += matched[0].length;
    return matched[0];
  }

  /**
   * Obtains next token.
   */
  getNextToken(): TokenDetails {
    if (!this.hasMoreTokens()) {
      return {
        ...this._getHints(),
      };
    }

    const str = this._string.slice(this._cursor);

    for (const [regexp, tokenType] of Spec) {
      const tokenValue = this._match(regexp, str);
      if (tokenValue == null) {
        continue;
      }

      debugger
      if (tokenType == null) {
        return this.getNextToken();
      }

      const td: TokenDetails = {
        ...this._getHints(),
        token: {
          type: tokenType,
          value: tokenValue
        }
      };
      td.token.up = td;
      return td;
    }


    const hints = this._getHints()
    throw new SaeSyntaxError(`Unexpected token sequence: ${str.substring(0, 5).underline.bold}...`, hints)
  }

  _getHints(): Omit<TokenDetails, 'token'> {
    const nextLineBreak = (() => {
      let cursor = this._cursor;
      while (cursor < this._string.length && this._string[++cursor] !== '\n');
      return cursor;
    })()

    const lines = this._string.slice(0, nextLineBreak).split('\n');
    const afterLines = this._string.slice(nextLineBreak + 2).split('\n');
    const linePad = lines.length.toString().length
    while (lines[lines.length - 1]?.trim()?.length === 0) {
      lines.pop();
    }
    const column = this._cursor - lines
      .slice(0, lines.length === 1 ? 1 : -1)
      .reduce((acc, it) => acc + it.length + 1, 0);

    const errorHint = `${lines.slice(Math.max(lines.length - 4, 0), lines.length - 1).map((line, idx, arr) => `${padLeft(linePad, (lines.length - arr.length + idx).toString())} ${'|'.gray}  ${line}`).join('\n')}
${padLeft(linePad, lines.length + '')} ${'|'.gray}  ${lines.slice(-1)[0]}
${[lines.length.toString().split(''), 0, 0].map(() => ' ').join('')}${new Array(column - 1 < 1 ? 1 : column - 1).fill(' ').join('') + "^^^".red}
${afterLines.slice(0, Math.min(afterLines.length, 2)).map((line, idx) => `${padLeft(linePad, (lines.length + idx + 1).toString())} ${'|'.gray}  ${line}`).join('\n')}
`

    return {
      errorHint,
      column,
      line: lines.length,
      file: this._file || '<annonymous>'
    }
  }
}

const padLeft = (len: number, str: string): string => {
  const size = len - str.length;
  return new Array(Math.max(size, 0)).fill(' ').join('') + str.gray;
}