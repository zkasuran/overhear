// Confirmed-valid MiniMax voices (probed live 2026-08-26) and show-format presets.
// See docs/VERIFY-RESULTS.md for the probe. English_Deep-VoicedMan is INVALID.

export const EMOTIONS = [
  "auto", "calm", "happy", "sad", "angry", "fearful", "disgusted", "surprised",
] as const;
export type Emotion = (typeof EMOTIONS)[number];

export const VALID_VOICES = [
  "English_expressive_narrator",
  "English_Trustworth_Man",
  "English_Graceful_Lady",
  "English_Gentle-voiced_man",
  "English_Diligent_Man",
  "English_Wiselady",
  "English_CalmWoman",
  "English_captivating_female1",
  "English_radiant_girl",
  "English_magnetic_voiced_man",
  "English_Aussie_Bloke",
  "English_PatientMan",
  "English_Debator",
] as const;
export type Voice = (typeof VALID_VOICES)[number];

export function isValidVoice(v: string): v is Voice {
  return (VALID_VOICES as readonly string[]).includes(v);
}

export type FormatId = "explainer" | "debate" | "cozy" | "hype";

export type FormatPreset = {
  id: FormatId;
  label: string;
  blurb: string;
  hostName: string;
  expertName: string;
  hostVoice: Voice;
  expertVoice: Voice;
  hostEmotion: Emotion;
  expertEmotion: Emotion;
  /** appended to the Music 3.0 style prompt */
  musicSeed: string;
  /** steers M3's script tone */
  tone: string;
};

export const FORMATS: Record<FormatId, FormatPreset> = {
  explainer: {
    id: "explainer",
    label: "Curious explainer",
    blurb: "A warm host and a sharp expert unpack one idea end to end.",
    hostName: "Ava",
    expertName: "Theo",
    hostVoice: "English_expressive_narrator",
    expertVoice: "English_Trustworth_Man",
    hostEmotion: "happy",
    expertEmotion: "calm",
    musicSeed: "warm indie-pop podcast theme, bright synths, light drums, upbeat, catchy, mid tempo",
    tone: "friendly, curious, plain-spoken; the host asks great questions, the expert answers with vivid concrete detail",
  },
  debate: {
    id: "debate",
    label: "Two-sided debate",
    blurb: "Two voices argue the strongest case on each side, fairly.",
    hostName: "Nadia",
    expertName: "Marcus",
    hostVoice: "English_Debator",
    expertVoice: "English_Diligent_Man",
    hostEmotion: "surprised",
    expertEmotion: "calm",
    musicSeed: "tense cinematic underscore, pulsing strings, low percussion, serious, building",
    tone: "sharp but respectful; each speaker steel-mans one side, concedes real points, no strawmen",
  },
  cozy: {
    id: "cozy",
    label: "Cozy wind-down",
    blurb: "A calm, unhurried take for a walk or the end of the day.",
    hostName: "Elena",
    expertName: "Sam",
    hostVoice: "English_CalmWoman",
    expertVoice: "English_Gentle-voiced_man",
    hostEmotion: "calm",
    expertEmotion: "calm",
    musicSeed: "gentle lofi ambient, soft piano, mellow beat, warm, relaxed, slow tempo",
    tone: "soft, reflective, unhurried; short sentences, lots of imagery, nothing frantic",
  },
  hype: {
    id: "hype",
    label: "Hype trailer",
    blurb: "A punchy, high-energy trailer that makes the idea feel huge.",
    hostName: "Zoe",
    expertName: "Rex",
    hostVoice: "English_radiant_girl",
    expertVoice: "English_magnetic_voiced_man",
    hostEmotion: "happy",
    expertEmotion: "surprised",
    musicSeed: "epic trailer build, big drums, rising synth, energetic, triumphant, fast tempo",
    tone: "punchy and vivid; short hype lines, big stakes, momentum that keeps building",
  },
};

export const DEFAULT_FORMAT: FormatId = "explainer";
