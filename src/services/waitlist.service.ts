export interface WaitlistResult { ok: boolean; persisted: boolean }

/** No waitlist backend yet, in any data mode: the form confirms, nothing is stored, and the UI says so. */
export const waitlistService = {
  async join(email: string): Promise<WaitlistResult> {
    void email;
    await new Promise((r) => setTimeout(r, 450));
    return { ok: true, persisted: false };
  },
};
