export default class AudioNode extends AudioWorkletNode {
  /**
   * Initialize the Audio processor by sending the fetched WebAssembly module to
   * the processor worklet.
   *
   * @param {ArrayBuffer} wasmBytes Sequence of bytes representing the entire
   * WASM module that will handle pitch detection.
   */
  init(wasmBytes, onPitchDetectedCallback) {
    this.onPitchDetectedCallback = onPitchDetectedCallback;

    // Listen to messages sent from the audio processor.
    this.port.onmessage = (event) => this.onmessage(event.data);

    this.port.postMessage({
      type: "send-wasm-module",
      wasmBytes,
      sampleRate: this.context.sampleRate,
    });

    this.onprocessorerror = (e) => {
      console.log(
        `An error from AudioWorkletProcessor.process() occurred: ${e}`
      );
    };
  }

  onmessage(event) {
    if (event.type === "pitch") {
      this.onPitchDetectedCallback(event.pitch);
    }
  }
}
