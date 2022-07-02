import SETTINGS_NAMES from "@modules/settings/utils/settingsNames";

const LABEL = 'Devices Settings';
const LS_SAVE_INFO_NAME = 'wr-devices-common';
const SAVE_VERSION = 'v1.0';
const DEVICE_CHANGE_EVENT = 'devicechange';
const TIMEOUT_FOR_PREPARE_DEVICE = 15000;

const DEFAULT_SAVE = {
    version: SAVE_VERSION,
    enabled: {
        [SETTINGS_NAMES.AUDIO_TYPE]: false,
        [SETTINGS_NAMES.VIDEO_TYPE]: false,
    },
};

const
    DIRECTORY = {
        enabled: 'enabled',
    };

export {
    LABEL,
    LS_SAVE_INFO_NAME,
    SAVE_VERSION,
    DEVICE_CHANGE_EVENT,
    TIMEOUT_FOR_PREPARE_DEVICE,
    DEFAULT_SAVE,
    DIRECTORY,
};