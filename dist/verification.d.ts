import { KeyraServerClient } from "./client.js";
import type { CreateVerificationInput, CreateVerificationResponse, ValidateVerificationInput, ValidateVerificationResponse } from "./types.js";
export declare class VerificationApi {
    private readonly client;
    constructor(client: KeyraServerClient);
    createVerification(input: CreateVerificationInput): Promise<CreateVerificationResponse>;
    validateVerification(input: ValidateVerificationInput): Promise<ValidateVerificationResponse>;
}
