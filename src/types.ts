export type VerificationStatus =
  | "created"
  | "pending"
  | "scanned"
  | "approved"
  | "rejected"
  | "expired"
  | "consumed";

export type CreateVerificationInput = {
  client_id: string;
  redirect_uri: string;
  state: string;
  code_challenge: string;
  code_challenge_method: "S256";
  response_type?: "code";
  mode?: "auto" | "popup" | "redirect";
  scope?: string;
};

export type ExchangeAuthorizationCodeInput = {
  code: string;
  code_verifier: string;
  redirect_uri: string;
  client_id: string;
};

export type TokenExchangeResponse = {
  access_token: string;
  token_type?: string;
  expires_in?: number;
  user?: Record<string, unknown> | null;
};

export type CreateVerificationResponse = {
  verification_id: string;
  status: VerificationStatus;
  authorize_url: string;
  expires_in: number;
};

export type ValidateVerificationInput = {
  verification_token: string;
  client_id?: string;
};

export type ValidateVerificationResponse = {
  valid: boolean;
  verification_id?: string;
  client_id?: string;
  expires_at?: string;
  user?: Record<string, unknown> | null;
  error?: string;
};
