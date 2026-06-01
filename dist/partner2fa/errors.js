export class KeyraError extends Error {
    constructor(message) {
        super(message);
        this.name = "KeyraError";
    }
}
export class KeyraNetworkError extends KeyraError {
    constructor(message, cause) {
        super(message);
        this.name = "KeyraNetworkError";
        this.cause = cause;
    }
}
export class KeyraAuthenticationError extends KeyraError {
    constructor(message = "Authentication failed") {
        super(message);
        this.name = "KeyraAuthenticationError";
    }
}
export class KeyraTimeoutError extends KeyraError {
    constructor(message) {
        super(message);
        this.name = "KeyraTimeoutError";
    }
}
export class KeyraChallengeExpiredError extends KeyraError {
    constructor(message = "Challenge expired") {
        super(message);
        this.name = "KeyraChallengeExpiredError";
    }
}
export class KeyraChallengeDeniedError extends KeyraError {
    constructor(message = "Challenge denied") {
        super(message);
        this.name = "KeyraChallengeDeniedError";
    }
}
export class KeyraEnrollmentExpiredError extends KeyraError {
    constructor(message = "Enrollment expired") {
        super(message);
        this.name = "KeyraEnrollmentExpiredError";
    }
}
export class KeyraEnrollmentCancelledError extends KeyraError {
    constructor(message = "Enrollment cancelled") {
        super(message);
        this.name = "KeyraEnrollmentCancelledError";
    }
}
export class KeyraEnrollmentFailedError extends KeyraError {
    constructor(message = "Enrollment failed") {
        super(message);
        this.name = "KeyraEnrollmentFailedError";
    }
}
