import RecordRTC, { WebAssemblyRecorder } from "recordrtc";

let Recorder = null;
let partNumber = 1;
let removeEventListenerDataAvailable = null;

function handleDataAvailable() {
    if ( !Recorder ) {
        return;
    }

    const blobData = Recorder.getBlob();

    console.group(`===[ Part #${partNumber++} ]===`);
    console.log(blobData);
    console.groupEnd();

    if ( blobData ) {
        const blobUrl = URL.createObjectURL(blobData);
        const a = document.createElement('a');
        a.target = '_blank';
        a.href = blobUrl;
        a.download = 'File.webm';
        a.click();
    }
}

function addEventListenerDataAvailable(timeout) {
    let interval = setInterval(() => {
        handleDataAvailable();
    }, timeout);

    return function clearListener() {
        clearInterval(interval);
        interval = null;
    };
}

function makeRecorder(mediaStream, options) {
    Recorder = new RecordRTC(mediaStream, {
        type: 'video',
        recorderType: WebAssemblyRecorder,
        disableLogs: false,
        frameRate: options.frameRate || 25,
        width: options.width || 1920,
        height: options.height || 1080,
        bitrate: options.bitrate || 10 * 1_000_000,
        realtime: false,
    });

    partNumber = 1;
}

function startRecord(timeoutDataAvailable = 0) {
    Recorder.startRecording();

    if ( !timeoutDataAvailable ) {
        return;
    }

    removeEventListenerDataAvailable = addEventListenerDataAvailable(timeoutDataAvailable);
}

function stopRecord() {
    Recorder.stopRecording(handleDataAvailable);

    if ( removeEventListenerDataAvailable ) {
        removeEventListenerDataAvailable()
    }
}


export {
    makeRecorder,
    startRecord,
    stopRecord,
};