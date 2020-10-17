import init, { WasmPitchDetector } from "./wasm-audio/wasm_audio.js";

class AudioProcessor extends AudioWorkletProcessor {
  constructor() {
    super();

    this.samples = [];

    this.port.onmessage = (event) => this.onmessage(event.data);

    this.detector = null;
  }

  onmessage = (eventData) => {
    switch (eventData.type) {
      case "send-wasm-module": {
        init(WebAssembly.compile(eventData.wasmBytes)).then(() => {
          console.log("Wasm compiled successfully.");
          this.detector = new WasmPitchDetector(eventData.sampleRate);
        });
        break;
      }
    }
  };

  process(inputs, outputs) {
    const BUFFER_LENGTH = 1024;

    // By default, the node has single input and output.
    const input = inputs[0];

    this.samples = [...this.samples, ...input[0]];
    this.samples = this.samples.slice(
      Math.max(0, this.samples.length - BUFFER_LENGTH)
    );
    // const numInputChannels = input.length;
    // if (numInputChannels < 1) {
    //   return false;
    // }

    // const updatesPerSecond = sampleRate / 128;
    // const desiredUpdatesPerSecond = updatesPerSecond;
    // const iterationsPerUpdate = Math.ceil(
    //   updatesPerSecond / desiredUpdatesPerSecond
    // );

    const inputSamples = input[0];

    if (this.samples.length >= 1024) {
      const result = detect_pitch(this.samples, 48000);

      this.port.postMessage(result);
    }
    // this.wasmSamplesProcessor.add_samples_chunk(inputSamples);

    console.log(this.samples.length);
    return true;

    //     if (
    //       this.pitchDetector &&
    //       ++this.iteration % iterationsPerUpdate === 0 &&
    //       this.wasmSamplesProcessor.has_sufficient_samples(this.pitchDetector)
    //     ) {
    //       try {
    //         this.wasmSamplesProcessor.set_latest_samples_on(this.pitchDetector);

    //         const result = this.pitchDetector.pitches();

    //         if (result.code !== "success") {
    //           console.log("error getting pitches");
    //         } else {
    //           const pitches = result.pitches;
    //           if (pitches.length > 0) {
    //             this.port.postMessage({
    //               type: "pitches",
    //               result: pitches.map((p) => ({
    //                 frequency: p.frequency,
    //                 clarity: p.clarity,
    //                 t: p.t,
    //                 onset: p.onset,
    //               })),
    //             });

    //             pitches.forEach((p) => p.free());
    //           }
    //         }
    //       } catch (e) {
    //         console.error(e);
    //       }
    //     }

    //     return true;
    //   }
  }
}

registerProcessor("AudioProcessor", AudioProcessor);
