import { inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { TranslationService } from '../../../shared/i18n/translation.service';

@Injectable({
  providedIn: 'root'
})
export class SpeechService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly translationService = inject(TranslationService);
  
  readonly isSupported = signal<boolean>(false);
  readonly currentlyPlayingId = signal<any | null>(null);

  private activePlayingId: any = null;
  private chunkQueue: string[] = [];
  private currentChunkIndex = 0;
  private selectedVoice: SpeechSynthesisVoice | null = null;

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      const hasSpeech = typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
      this.isSupported.set(hasSpeech);
    }
  }

  /**
   * Helper to wait for SpeechSynthesis voices to be loaded.
   */
  private getVoicesAsync(): Promise<SpeechSynthesisVoice[]> {
    return new Promise((resolve) => {
      const synth = window.speechSynthesis;
      let voices = synth.getVoices();
      if (voices && voices.length > 0) {
        resolve(voices);
        return;
      }
      
      const listener = () => {
        voices = synth.getVoices();
        if (voices && voices.length > 0) {
          synth.removeEventListener('voiceschanged', listener);
          resolve(voices);
        }
      };
      
      synth.addEventListener('voiceschanged', listener);
      
      // Safety timeout after 1 second
      setTimeout(() => {
        synth.removeEventListener('voiceschanged', listener);
        resolve(synth.getVoices() || []);
      }, 1000);
    });
  }

  /**
   * Speak a message text using the local SpeechSynthesis browser API.
   * Plays the message as toggleable chunks.
   */
  async speak(id: any, text: string): Promise<void> {
    if (!this.isSupported()) return;

    // Always stop and cancel any ongoing speech before starting a new playback
    this.stop();

    // Detect language from text (if it contains Arabic characters, use ar-EG)
    const hasArabic = /[\u0600-\u06FF]/.test(text);
    const targetLang = hasArabic ? 'ar-EG' : 'en-US';

    // Async voice loading and selection done once at start to eliminate delays between chunks
    const voices = await this.getVoicesAsync();
    this.selectedVoice = this.findFemaleVoice(voices, targetLang);

    this.activePlayingId = id;
    this.currentlyPlayingId.set(id);
    this.currentChunkIndex = 0;
    this.chunkQueue = this.splitTextIntoChunks(this.sanitizeText(text));

    if (this.chunkQueue.length === 0) {
      this.currentlyPlayingId.set(null);
      this.activePlayingId = null;
      return;
    }

    await this.playNextChunk(id, targetLang);
  }

  /**
   * Play the current chunk in the queue.
   */
  private async playNextChunk(id: any, targetLang: string): Promise<void> {
    if (this.activePlayingId !== id || this.currentChunkIndex >= this.chunkQueue.length) {
      this.currentlyPlayingId.set(null);
      this.activePlayingId = null;
      return;
    }

    const chunk = this.chunkQueue[this.currentChunkIndex];
    const utterance = new SpeechSynthesisUtterance(chunk);
    
    // Configure natural settings
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    utterance.lang = targetLang;

    // Assign pre-selected voice synchronously to eliminate inter-sentence delay
    if (this.selectedVoice) {
      utterance.voice = this.selectedVoice;
    }

    utterance.onend = () => {
      if (this.activePlayingId === id) {
        this.currentChunkIndex++;
        void this.playNextChunk(id, targetLang);
      }
    };

    utterance.onerror = (event) => {
      console.error('[SpeechService] SpeechSynthesis error:', event);
      if (this.activePlayingId === id) {
        this.currentChunkIndex++;
        void this.playNextChunk(id, targetLang);
      }
    };

    window.speechSynthesis.speak(utterance);
  }

  /**
   * Stop any ongoing speech.
   */
  stop(): void {
    if (!this.isSupported()) return;
    this.activePlayingId = null;
    this.chunkQueue = [];
    this.currentChunkIndex = 0;
    this.selectedVoice = null;
    this.currentlyPlayingId.set(null);
    window.speechSynthesis.cancel();
  }

  /**
   * Cleans text to remove markdown formatting, emojis, icons, and special indicators before speaking.
   */
  private sanitizeText(text: string): string {
    if (!text) return '';
    
    // Remove markdown symbols: *, _, `, #, -
    let clean = text.replace(/[*_`#-]/g, ' ');
    
    // Remove emojis and pictographs
    try {
      clean = clean.replace(/[\u{1F300}-\u{1F9FF}]/gu, '')
                   .replace(/[\u{1F600}-\u{1F64F}]/gu, '')
                   .replace(/[\u{1F680}-\u{1F6FF}]/gu, '')
                   .replace(/[\u{2600}-\u{27BF}]/gu, '')
                   .replace(/[\u{E000}-\u{F8FF}]/gu, ''); // Private Use Area icons
    } catch (e) {
      clean = clean.replace(/[\u2600-\u27BF]/g, '');
    }

    // Remove specific custom bullet points or action indicator symbols
    clean = clean.replace(/[✦★☆✔✖🔊📢🔔]/g, '');

    // Collapse multiple spaces
    clean = clean.replace(/\s+/g, ' ');

    return clean.trim();
  }

  /**
   * Split long text into manageable chunks safely.
   */
  private splitTextIntoChunks(text: string): string[] {
    const maxChunkLen = 200;
    // Split by major sentence boundaries only (. ! ? ؟ \n) to allow natural flow for commas/semicolons
    const sentences = text.match(/[^.!?؟\n]+[.!?؟\n]*|.+/g) || [text];
    const chunks: string[] = [];
    
    for (let sentence of sentences) {
      sentence = sentence.trim();
      if (!sentence) continue;
      
      if (sentence.length <= maxChunkLen) {
        chunks.push(sentence);
      } else {
        // Fallback: If a single sentence exceeds the length, split by commas/semicolons first
        const subSentences = sentence.split(/([,،;؛])/);
        let temp = '';
        
        for (const sub of subSentences) {
          if ((temp + sub).length <= maxChunkLen) {
            temp += sub;
          } else {
            if (temp.trim()) {
              chunks.push(temp.trim());
            }
            temp = sub;
          }
        }
        
        if (temp.trim()) {
          // If still too long, split by words
          if (temp.length > maxChunkLen) {
            let tempWord = '';
            const words = temp.split(/\s+/);
            for (const word of words) {
              if ((tempWord + ' ' + word).trim().length <= maxChunkLen) {
                tempWord = (tempWord + ' ' + word).trim();
              } else {
                if (tempWord) chunks.push(tempWord);
                tempWord = word;
              }
            }
            if (tempWord) chunks.push(tempWord);
          } else {
            chunks.push(temp.trim());
          }
        }
      }
    }
    return chunks;
  }

  /**
   * Find the best female voice matching the language code.
   */
  private findFemaleVoice(voices: SpeechSynthesisVoice[], langCode: string): SpeechSynthesisVoice | null {
    if (!voices || voices.length === 0) return null;

    // Normalize language codes (e.g., converting underscores like ar_EG to hyphens ar-EG)
    const normalizeLang = (l: string) => l.toLowerCase().replace('_', '-');
    const targetLangNormalized = normalizeLang(langCode);

    // Filter by language (exact match, e.g. en-US, ar-EG)
    let langVoices = voices.filter(v => normalizeLang(v.lang) === targetLangNormalized);
    
    // Fallback: base language match (starts with 'en' or 'ar')
    if (langVoices.length === 0) {
      const baseLang = targetLangNormalized.split('-')[0];
      langVoices = voices.filter(v => normalizeLang(v.lang).startsWith(baseLang));
    }

    if (langVoices.length === 0) return null;

    // Combined list of preferred and generic female voice name indicators
    const femaleIndicators = [
      'aria', 'samantha', 'susan', 'salma', 'zeina', 'laila',
      'muna', 'mariam', 'yasmin', 'amina', 'hoda', 'zira',
      'hazel', 'heera', 'haruka', 'zharina', 'noora', 'karen',
      'moira', 'tessa', 'veena', 'victoria', 'female', 'google female'
    ];

    // Priority 1: Look for Microsoft "Natural" online voices (most human-like, non-formal)
    for (const indicator of femaleIndicators) {
      const found = langVoices.find(v => {
        const nameLower = v.name.toLowerCase();
        return nameLower.includes(indicator) && (nameLower.includes('natural') || nameLower.includes('online'));
      });
      if (found) return found;
    }

    // Priority 2: Look for Google high-quality online voices
    for (const indicator of femaleIndicators) {
      const found = langVoices.find(v => {
        const nameLower = v.name.toLowerCase();
        return nameLower.includes(indicator) && nameLower.includes('google');
      });
      if (found) return found;
    }

    // Priority 3: Look for any matching female voice name (offline/system voices)
    for (const indicator of femaleIndicators) {
      const found = langVoices.find(v => v.name.toLowerCase().includes(indicator));
      if (found) return found;
    }

    // Fallback: First voice matching the language
    return langVoices[0];
  }
}
