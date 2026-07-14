async function installSpeechSynthesisMock(page) {
  await page.addInitScript(() => {
    class MockSpeechSynthesisUtterance {
      constructor(text = "") {
        this.text = String(text);
        this.lang = "";
        this.voice = null;
        this.rate = 1;
        this.pitch = 1;
        this.volume = 1;
        this.onstart = null;
        this.onend = null;
        this.onerror = null;
      }
    }

    const voices = [
      { default: true, lang: "en-US", localService: true, name: "Characterization English US", voiceURI: "mock:en-US" },
      { default: false, lang: "en-GB", localService: true, name: "Characterization English UK", voiceURI: "mock:en-GB" }
    ];

    const state = {
      cancelled: 0,
      paused: false,
      queue: [],
      resumed: 0,
      speaking: false
    };

    const synthesis = {
      onvoiceschanged: null,
      get paused() { return state.paused; },
      get pending() { return state.queue.length > 1; },
      get speaking() { return state.speaking; },
      cancel() {
        state.cancelled += 1;
        state.paused = false;
        state.queue = [];
        state.speaking = false;
      },
      getVoices() { return voices.map((voice) => ({ ...voice })); },
      pause() { state.paused = true; },
      resume() {
        state.paused = false;
        state.resumed += 1;
      },
      speak(utterance) {
        state.queue.push({
          lang: utterance.lang,
          pitch: utterance.pitch,
          rate: utterance.rate,
          text: utterance.text,
          voice: utterance.voice ? utterance.voice.name : null,
          volume: utterance.volume
        });
        state.speaking = true;
        if (typeof utterance.onstart === "function") utterance.onstart();
      }
    };

    Object.defineProperty(window, "SpeechSynthesisUtterance", {
      configurable: true,
      value: MockSpeechSynthesisUtterance
    });
    Object.defineProperty(window, "speechSynthesis", {
      configurable: true,
      value: synthesis
    });
    Object.defineProperty(window, "__speechSynthesisMock", {
      configurable: true,
      value: state
    });
  });
}

module.exports = { installSpeechSynthesisMock };
