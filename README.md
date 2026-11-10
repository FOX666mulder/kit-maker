# Kit Maker

A standalone Windows/macOS desktop app for arranging audio samples into a 16-pad kit, previewing them, and transferring the audio between MPC Sample and Native Instruments MASCHINE workflows.

## Current prototype

- Import common audio files into a sample pool and assign them to 16 pads.
- Preview a loaded pad by double-clicking it.
- Save a portable kit folder containing named sample files and `kit-maker.json`.
- Reopen a Kit Maker kit, or import audio files from a folder exported by another sampler/workstation.
- Choose a simple universal, MPC Sample, or MASCHINE STUDIO 4x4 pad-layout label.

Kit Maker currently transfers sample audio and pad organization; it does **not** create proprietary MPC or MASCHINE project files. Use the exported `Samples` folder to load the sounds in the target software/device, then import audio or sample files back into Kit Maker to continue working across setups. Exact native project support can be added after confirming formats and device/software versions.

## Run from source

Requires Node.js and npm.

```sh
npm install
npm start
```

## Build desktop installers

Build on each target operating system (macOS packaging is normally performed on macOS; Windows packaging on Windows):

```sh
npm run dist:win
npm run dist:mac
```

Packaged installers are written to `dist/`.

## Next steps

- Add editable per-pad labels and common sample settings.
- Validate exported folders on the specific MPC Sample firmware and MASCHINE STUDIO software setup.
- Add native formats only where documented and tested.
