import { KeyraServerClient } from "./client.js";
import type {
  CreateVerificationInput,
  CreateVerificationResponse,
  ValidateVerificationInput,
  ValidateVerificationResponse,
} from "./types.js";

export class VerificationApi {
  constructor(private readonly client: KeyraServerClient) {}

  createVerification(input: CreateVerificationInput) {
    return this.client.request<CreateVerificationResponse>("/verify/start", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  validateVerification(input: ValidateVerificationInput) {
    return this.client.request<ValidateVerificationResponse>("/verify/validate", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }
}
