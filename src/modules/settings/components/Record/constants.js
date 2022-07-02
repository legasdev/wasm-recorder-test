import {DEFAULT_QUALITY_RECORD} from "@modules/settings";

const LABEL = 'Record Settings';
const LS_SAVE_INFO_NAME = 'wr-record-common';
const SAVE_VERSION = 'v1.0';
const DEFAULT_SAVE = {
    version: SAVE_VERSION,
    quality: DEFAULT_QUALITY_RECORD,
    volume: 100,
    muted: false,
    uploadMode: false,
};
const
    DIRECTORY = {
        quality: 'quality',
        volume: 'volume',
        muted: 'muted',
        uploadMode: 'uploadMode',
    };

export {
    LABEL,
    LS_SAVE_INFO_NAME,
    SAVE_VERSION,
    DEFAULT_SAVE,
    DIRECTORY
};