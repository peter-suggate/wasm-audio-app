use wasm_bindgen::prelude::*;
use pitch_detection::{McLeodDetector, PitchDetector};

// #[wasm_bindgen]
// pub fn setup(sample_rate: usize) {
//     const SIZE : usize = 1024;              // Number of audio samples for each analysis
//     const PADDING : usize = SIZE / 2;       // Padding used for the algorithm
//     const POWER_THRESHOLD : f32 = 5.0;
//     const CLARITY_THRESHOLD : f32 = 0.7;

//     detector = Some(McLeodDetector::<f32>::new(SIZE, PADDING));
// }

const SIZE : usize = 1024;              // Number of audio samples for each analysis
const PADDING : usize = SIZE / 2;       // Padding used for the algorithm
const POWER_THRESHOLD : f32 = 5.0;
const CLARITY_THRESHOLD : f32 = 0.7;

#[wasm_bindgen]
pub struct WasmPitchDetector {
  sample_rate: usize,
  detector: McLeodDetector::<f32>,
}

#[wasm_bindgen]
impl WasmPitchDetector {
  pub fn new(sample_rate: usize) -> WasmPitchDetector {
    WasmPitchDetector {
      sample_rate,
      detector: McLeodDetector::<f32>::new(SIZE, PADDING)
    }
  }

  pub fn detect_pitch(mut self, audio_samples: Vec<f32>) -> f32 {
    if audio_samples.len() < SIZE {
      panic!("Insufficient samples passed to detect_pitch(). Expected an array containing {} elements but got {}", SIZE, audio_samples.len())
    }

    // const POWER_THRESHOLD : f32 = 5.0;
    // const CLARITY_THRESHOLD : f32 = 0.7;

      // let mut detector = McLeodDetector::<f32>::new(SIZE, PADDING);
    let pitch = self.detector.get_pitch(&audio_samples, self.sample_rate, POWER_THRESHOLD, CLARITY_THRESHOLD).unwrap();

      // return pitch;
    return pitch.frequency;
      // return 440.0;
  }
}

// #[wasm_bindgen]
// pub fn detect_pitch(audio_samples: Vec<f32>) -> f32 {
//     if audio_samples.len() < SIZE {
//         panic!("Insufficient samples passed to detect_pitch(). Expected an array containing {} elements but got {}", SIZE, audio_samples.len())
//     }

//     // let mut detector = McLeodDetector::<f32>::new(SIZE, PADDING);
//     let mut pitch = match detector {
//         Some(detector) => detector.get_pitch(&audio_samples, sample_rate, POWER_THRESHOLD, CLARITY_THRESHOLD).unwrap(),
//         None => panic!("detect_pitch() called before setup(). Call setup() once to initialize the pitch detector."),
//     };

//     return pitch;
//     // return pitch.frequency;
//     // return 440.0;
// }
