export declare class KeyraError extends Error {
    constructor(message: string);
}
export declare class KeyraNetworkError extends KeyraError {
    readonly cause: unknown;
    constructor(message: string, cause?: unknown);
}
export declare class KeyraAuthenticationError extends KeyraError {
    constructor(message?: string);
}
export declare class KeyraTimeoutError extends KeyraError {
    constructor(message: string);
}
export declare class KeyraChallengeExpiredError extends KeyraError {
    constructor(message?: string);
}
export declare class KeyraChallengeDeniedError extends KeyraError {
    constructor(message?: string);
}
export declare class KeyraEnrollmentExpiredError extends KeyraError {
    constructor(message?: string);
}
export declare class KeyraEnrollmentCancelledError extends KeyraError {
    constructor(message?: string);
}
export declare class KeyraEnrollmentFailedError extends KeyraError {
    constructor(message?: string);
}
