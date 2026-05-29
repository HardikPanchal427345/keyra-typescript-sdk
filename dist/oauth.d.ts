export type PkcePair = {
    codeVerifier: string;
    codeChallenge: string;
    codeChallengeMethod: "S256";
};
export declare function generatePkce(): PkcePair;
