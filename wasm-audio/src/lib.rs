use pitch_detection::{McLeodDetector, PitchDetector};
use wasm_bindgen::prelude::*;
mod utils;

#[wasm_bindgen]
pub struct WasmPitchDetector {
  sample_rate: usize,
  fft_size: usize,
  detector: McLeodDetector<f32>,
}

#[wasm_bindgen]
impl WasmPitchDetector {
  pub fn new(sample_rate: usize, fft_size: usize) -> WasmPitchDetector {
    utils::set_panic_hook();

    // Define the amount of zero-padding applied to each analysis FFT. Padding,
    // in combination with the windowing function used by the algorithm helps
    // "smooth" the results as the analysis moves across the incoming sampled audio
    // data. Using a pad of half the fft length works well for many instruments.
    let fft_pad = fft_size / 2;

    WasmPitchDetector {
      sample_rate,
      fft_size,
      detector: McLeodDetector::<f32>::new(fft_size, fft_pad),
    }
  }

  pub fn detect_pitch(&mut self, audio_samples: Vec<f32>) -> f32 {
    if audio_samples.len() < self.fft_size {
      panic!("Insufficient samples passed to detect_pitch(). Expected an array containing {} elements but got {}", self.fft_size, audio_samples.len());
    }

    // Include only notes that exceed a power threshold which relates to the
    // amplitude of frequencies in the signal. Use the library's suggested
    // default value of 5.0.
    const POWER_THRESHOLD: f32 = 5.0;

    // The clarity measure describes how coherent the sound of a note is. For
    // example, the background sound in a crowded room would typically be would
    // have low clarity and a ringing tuning fork would have high clarity.
    // This threshold is used to accept detect notes that are clear enough
    // (valid values are in the range 0-1).
    const CLARITY_THRESHOLD: f32 = 0.6;

    let optional_pitch = self.detector.get_pitch(
      &audio_samples,
      self.sample_rate,
      POWER_THRESHOLD,
      CLARITY_THRESHOLD,
    );

    match optional_pitch {
      Some(pitch) => pitch.frequency,
      None => 0.0,
    }
  }
}
