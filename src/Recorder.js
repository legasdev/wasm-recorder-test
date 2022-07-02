import RecordRTC, { WebAssemblyRecorder } from "recordrtc";

let Recorder = null;

function makeRecorder(mediaStream) {
    Recorder = RecordRTC(mediaStream, {
        type: 'video',
        recorderType: WebAssemblyRecorder,
    });

    console.log('Recorder', Recorder);
}

export {
    makeRecorder
};