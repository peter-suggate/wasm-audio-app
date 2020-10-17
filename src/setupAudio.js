import AudioNode from "./AudioNode";

async function getWebAudioMediaStream() {
  if (!window.navigator.mediaDevices) {
    throw new Error(
      "This browser does not support web audio or it is not enabled."
    );
  }

  try {
    const result = await window.navigator.mediaDevices.getUserMedia({
      audio: true,
      video: false,
    });

    return result;
  } catch (e) {
    switch (e.name) {
      case "NotAllowedError":
        throw new Error(
          "A recording device was found but has been disallowed for this application. Enable the device in the browser's settings."
        );

      case "NotFoundError":
        throw new Error(
          "No recording device was found. Please attach a microphone and click Retry."
        );

      default:
        throw e;
    }
  }
}

export async function setupAudio() {
  // Get the browser's audio. Awaits user "allowing" it for the current tab.
  const mediaStream = await getWebAudioMediaStream();

  const context = new window.AudioContext();
  const audioSource = context.createMediaStreamSource(mediaStream);

  let node;

  try {
    // Fetch the WebAssembly module that performs pitch detection.
    const response = await window.fetch("wasm-audio/wasm_audio_bg.wasm");
    const wasmBytes = await response.arrayBuffer();

    // Add our audio processor worklet to the context.
    const processorUrl = "AudioProcessor.js";
    try {
      await context.audioWorklet.addModule(processorUrl);
    } catch (e) {
      throw new Error(
        `Failed to load audio analyzer worklet at url: ${processorUrl}. Further info: ${e.message}`
      );
    }

    // Create the AudioWorkletNode which enables the main Javascript thread to
    // communicate with the audio processor (which runs in a Worklet).
    node = new AudioNode(context, "AudioProcessor");

    // Send the
    node.init(wasmBytes);

    // Connect the audio source (microphone output) to our analysis node.
    audioSource.connect(node);

    // Connect our analysis node to the output. Required even though we do not
    // output any audio. Allows further downstream audio processing or output to
    // occur.
    node.connect(context.destination);
  } catch (e) {
    throw new Error(
      `Failed to load audio analyzer WASM module. Further info: ${e.message}`
    );
  }

  return { context, node };
}
