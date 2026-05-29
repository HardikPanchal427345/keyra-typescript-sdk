export class KeyraServerError extends Error {
    constructor(message, status, body) {
        super(message);
        this.name = "KeyraServerError";
        this.status = status;
        this.body = body;
    }
}
