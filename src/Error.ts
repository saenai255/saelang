import { TokenDetails } from "./Tokenizer";

export class SaeError extends Error {
    constructor(protected msg: string, protected lookahead: TokenDetails) {
        super(msg);
    }

    toString() {
        throw new Error("Protected");
    }
}

export class SaeSyntaxError extends SaeError {
    toString() {
        const loc = `${this.lookahead.file}:${this.lookahead.line}:${this.lookahead.column}`;
        const locLine = new Array(loc.length).fill('~').join('');
        return `
=> Error! ${this.msg}

${loc}
${locLine}
${this.lookahead.errorHint}
`;
    }
}