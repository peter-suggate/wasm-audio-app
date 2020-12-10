import "./TextEncoder.js";
import init, { WasmPitchDetector } from "./wasm-audio/wasm_audio.js";

class PitchProcessor extends AudioWorkletProcessor {
  constructor() {
    super();

    // Initialized to an array holding a buffer of samples for analysis later -
    // once we know how many samples need to be stored. Meanwhile, an empty
    // array is used, so that early calls to process() with empty channels
    // do not break initialization.
    this.samples = [];
    this.totalSamples = 0;

    // Listen to events from the PitchNode running on the main thread.
    this.port.onmessage = (event) => this.onmessage(event.data);

    this.detector = null;
  }

  onmessage(event) {
    if (event.type === "send-wasm-module") {
      // PitchNode has sent us a message containing the Wasm library to load into
      // our context as well as information about the audio device used for
      // recording.
      init(WebAssembly.compile(event.wasmBytes)).then(() => {
        this.port.postMessage({ type: 'wasm-module-loaded' });
      });
    } else if (event.type === 'init-detector') {
      const { sampleRate, numAudioSamplesPerAnalysis } = event;

      // Store this because we use it later to detect when we have enough recorded
      // audio samples for our first analysis.
      this.numAudioSamplesPerAnalysis = numAudioSamplesPerAnalysis;

      this.detector = WasmPitchDetector.new(sampleRate, numAudioSamplesPerAnalysis);

      // Holds a buffer of audio sample values that we'll send to the Wasm module
      // for analysis at regular intervals.
      this.samples = new Array(numAudioSamplesPerAnalysis).fill(0);
      this.totalSamples = 0;
    }
  };

  process(inputs, outputs) {
    // inputs contains incoming audio samples for further processing. outputs
    // contains the audio samples resulting from any processing performed by us.
    // Here, we are performing analysis only to detect pitches so do not modify
    // outputs.

    // inputs holds one or more "channels" of samples. For example, a microphone
    // that records "in stereo" would provide two channels. For this simple app,
    // we use assume either "mono" input or the "left" channel if microphone is
    // stereo.

    const inputChannels = inputs[0];

    // inputSamples holds an array of new samples to process.
    const inputSamples = inputChannels[0];

    // In the AudioWorklet spec, process() is called whenever exactly 128 new
    // audio samples have arrived. We simplify the logic for filling up the
    // buffer by making an assumption that the analysis size is 128 samples or
    // larger and is a power of 2.
    if (this.totalSamples < this.numAudioSamplesPerAnalysis) {
      for (const sampleValue of inputSamples) {
        this.samples[this.totalSamples++] = sampleValue;
      }
    } else {
      // Buffer is already full. We do not want the buffer to grow continually,
      // so instead will "cycle" the samples through it so that it always
      // holds the latest ordered samples of length equal to
      // numAudioSamplesPerAnalysis.

      // Shift the existing samples left by the length of new samples (128).
      const numNewSamples = inputSamples.length;
      const numExistingSamples = this.samples.length - numNewSamples;
      for (let i = 0; i < numExistingSamples; i++) {
        this.samples[i] = this.samples[i + numNewSamples];
      }
      // Add the new samples onto the end, into the 128-wide slot vacated by
      // the previous copy.
      for (let i = 0; i < numNewSamples; i++) {
        this.samples[numExistingSamples + i] = inputSamples[i];
      }
      this.totalSamples += inputSamples.length;
    }

    // Once our buffer has enough samples, pass them to the Wasm pitch detector.
    if (this.totalSamples >= this.numAudioSamplesPerAnalysis && this.detector) {
      const result = this.detector.detect_pitch(this.samples);

      if (result !== 0) {
        this.port.postMessage({ type: "pitch", pitch: result });
      }
    }

    // Returning true tells the Audio system to keep going.
    return true;
  }
}

registerProcessor("PitchProcessor", PitchProcessor);
