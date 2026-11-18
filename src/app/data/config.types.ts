export type SongKind = 'intro' | 'question' | 'yes' | 'no';

export interface Song {
  id: string;
  start: number;
  vertical?: boolean;
}

export interface StoryPanel {
  title: string;
  text: string;
  photo?: 'sheeba';
  hint?: boolean;
}

export interface Activity {
  id: string;
  name: string;
  desc: string;
  location: string;
  verse: [string, string];
  times?: string[];
}

export interface AvailabilityDay {
  date: string;
  times: string[];
}

export interface AppConfig {
  to: string;
  from: string;
  organizerEmail: string;
  title: string;
  subtitle: string;
  durationMinutes: number;
  timezone: string;
  songs: Record<SongKind, Song>;
  photos: { sheeba: string; judging: string };
  story: StoryPanel[];
  noMessages: string[];
  noReason: { prompt: string; placeholder: string; sent: string };
  notify: { web3formsKey: string };
  activities: Activity[];
  times: Record<string, string>;
  stanza: { lines: string[]; timeFallback: string };
  signature: string;
  eventTitle: string;
  minDaysAhead: number;
  availability: AvailabilityDay[];
}
