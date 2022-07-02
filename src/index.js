import {
    Devices, PRESETS_VIDEO_RECORD,
    Record,
    SETTINGS_NAMES,
} from "./modules/settings";
import {
    CONSTANTS,
    UTILS,
} from "./common";
import {makeRecorder} from "./Recorder";


async function enableDevices(RecordSettings) {
    await Promise.all([
        RecordSettings.enable(SETTINGS_NAMES.AUDIO_TYPE, true),
        RecordSettings.enable(SETTINGS_NAMES.VIDEO_TYPE, true),
    ]);
}

async function makeStreamsObject(RecordSettings) {
    const
        defaultTrackObject = { track: null, reason: '' },
        audioTrackObject = await RecordSettings.getTrack(SETTINGS_NAMES.AUDIO_TYPE) || defaultTrackObject,
        videoTrackObject = await RecordSettings.getTrack(SETTINGS_NAMES.VIDEO_TYPE) || defaultTrackObject;

    return {
        [SETTINGS_NAMES.AUDIO_TYPE]: audioTrackObject,
        [SETTINGS_NAMES.VIDEO_TYPE]: videoTrackObject,
    };
}

function showVideoOnPage(mediaStream) {
    if ( !mediaStream ) {
        throw new Error('MediaStream missing.');
    }

    const $video = UTILS.domSearchElement(CONSTANTS.videoSelector);
    $video.srcObject = mediaStream;
    $video.muted = true;
    $video.play();
}

function changeActiveButtonStatus(isRecordReady = true) {
    const
        $buttonStartRecord = UTILS.domSearchElement(CONSTANTS.buttonStartRecordSelector),
        $buttonStopRecord = UTILS.domSearchElement(CONSTANTS.buttonStopRecordSelector);

    $buttonStartRecord.disabled = !isRecordReady;
    $buttonStopRecord.disabled = isRecordReady;
}

function showDeviceSettings(device) {
    if ( !device ) {
        return;
    }

    const $textarea = UTILS.domSearchElement(CONSTANTS.textareaDeviceInfoSelector);
    const capabilities = device.getCapabilities();

    $textarea.value = JSON.stringify(capabilities, null, '    ');
}

async function main() {
    const
        DevicesSettings = await Object.create(Devices).init(),
        RecordSettings = await Object.create(Record).init(DevicesSettings);

    await enableDevices(RecordSettings);
    showDeviceSettings(DevicesSettings.inputVideoDevice);
    const streams = await makeStreamsObject(RecordSettings);

    await RecordSettings.changeQuality(SETTINGS_NAMES.VIDEO_TYPE, PRESETS_VIDEO_RECORD["1080p_2"]);
    showVideoOnPage(streams[SETTINGS_NAMES.VIDEO_TYPE].track);
    makeRecorder(streams[SETTINGS_NAMES.VIDEO_TYPE].track);

    changeActiveButtonStatus();
}

main()
    .catch(error => console.error(error));
