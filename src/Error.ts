import 'colors';
import { TokenDetails } from "./Tokenizer";

export class SaeError extends Error {
    constructor(public msg: string, public lookahead: TokenDetails) {
        super(msg);
    }

    makeMessage() {
        throw new Error("Protected");
    }
}

export class SaeSyntaxError extends SaeError {
    constructor(public msg: string, public lookahead: TokenDetails) {
        super(msg, lookahead);
        this.msg = this.makeMessage()
    }

    toString() {
        return this.msg;
    }

    makeMessage() {
        const loc = `${this.lookahead.file}:${this.lookahead.line}:${this.lookahead.column + 1}`;
        return `
${'==> Compilation Error!'.red.bold}

>> ${loc.blue.underline}
${this.lookahead.errorHint}
${this.msg.red}`;
    }
}