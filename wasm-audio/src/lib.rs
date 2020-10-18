use pitch_detection::{McLeodDetector, PitchDetector};
use wasm_bindgen::prelude::*;
mod utils;

const SIZE: usize = 1024; // Number of audio samples for each analysis
const PADDING: usize = SIZE / 2; // Padding used for the algorithm
const POWER_THRESHOLD: f32 = 5.0;
const CLARITY_THRESHOLD: f32 = 0.7;

#[wasm_bindgen]
pub struct WasmPitchDetector {
  sample_rate: usize,
  detector: McLeodDetector<f32>,
}

#[wasm_bindgen]
impl WasmPitchDetector {
  pub fn new(sample_rate: usize) -> WasmPitchDetector {
    utils::set_panic_hook();

    WasmPitchDetector {
      sample_rate,
      detector: McLeodDetector::<f32>::new(SIZE, PADDING),
    }
  }

  pub fn detect_pitch(&mut self, audio_samples: Vec<f32>) -> f32 {
    if audio_samples.len() < SIZE {
      panic!("Insufficient samples passed to detect_pitch(). Expected an array containing {} elements but got {}", SIZE, audio_samples.len())
    }

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
