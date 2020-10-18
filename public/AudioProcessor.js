import "./TextEncoder.js";
import init, { WasmPitchDetector } from "./wasm-audio/wasm_audio.js";

class AudioProcessor extends AudioWorkletProcessor {
  constructor() {
    super();

    this.samples = [];

    this.port.onmessage = (event) => this.onmessage(event.data);

    this.detector = null;
  }

  onmessage = (eventData) => {
    if (eventData.type === "send-wasm-module") {
      // AudioNode has sent us a message containing the Wasm library to load into
      // our context as well as information about the audio device used for
      // recording.
      init(WebAssembly.compile(eventData.wasmBytes)).then(() => {
        this.detector = WasmPitchDetector.new(eventData.sampleRate);
      });
    }
  };

  process(inputs, outputs) {
    const BUFFER_LENGTH = 1024;

    // By default, the node has single input and output.
    const inputChannels = inputs[0];
    const inputSamples = inputChannels[0];
    if (!inputSamples) return;

    this.samples = [...this.samples, ...inputSamples];
    this.samples = this.samples.slice(
      Math.max(0, this.samples.length - BUFFER_LENGTH)
    );

    if (this.samples.length >= 1024 && this.detector) {
      const result = this.detector.detect_pitch(this.samples);

      if (result !== 0) {
        this.port.postMessage({ type: "pitch", pitch: result });
      }
    }

    return true;
  }
}

registerProcessor("AudioProcessor", AudioProcessor);
