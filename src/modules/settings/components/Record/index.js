import Events from "events-om";
import LocalStorageSaver from "@modules/local-storage-saver";

import {existEvent} from "@modules/settings/utils";
import DEVICES_STATUS from "@modules/settings/utils/devicesStatus";
import EVENTS_LIST from "@modules/settings/utils/eventsList";
import SETTINGS_NAMES from "@modules/settings/utils/settingsNames";
import {getConstraintsQuality} from "@modules/settings/utils/getConstraintsQuality";
import ERRORS from "@modules/settings/utils/errorList";
import {
    QualityRecordAudioPresets as QUALITY_AUDIO_PRESETS,
    QualityRecordVideoPresets as QUALITY_VIDEO_PRESETS
} from "@modules/settings/utils/qualityPresets";

import {
    LABEL,
    LS_SAVE_INFO_NAME,
    SAVE_VERSION,
    DEFAULT_SAVE,
    DIRECTORY
} from "@modules/settings/components/Record/constants";



/**
 *
 * @requires Events
 *
 * @type {{
 * EVENTS_LIST,
 * ERRORS,
 * init: (function(*): Promise<Record>),
 * _changeQuality: ((function(*, *): Promise<void>)|*),
 * _createTrack: ((function(*): Promise<{reason: string, track: null}|{reason: string, track: MediaStream}>)|*),
 * _enableTrack: ((function(*, *): Promise<void>)|*),
 * _getTrack: ((function(*): Promise<*|{reason: string, track: *}>)|*),
 * _handleDevicesChange: Record._handleDevicesChange,
 * _setTrackMuted: ((function(*): Promise<void>)|*),
 * _setTrackVolume: ((function(*): Promise<void>)|*),
 * readonly enabled: *|{"[SETTINGS_NAMES.AUDIO_TYPE]": boolean, "[SETTINGS_NAMES.VIDEO_TYPE]": boolean},
 * readonly volume: number|*,
 * readonly enabledAudio: *,
 * readonly muted: boolean|*,
 * readonly enabledVideo: *,
 * getTrack: (function(*): Promise<*|{reason: string, track: *}>),
 * mute: ((function(*, *): Promise<void>)|*),
 * setVolume: ((function(*): Promise<void>)|*),
 * remove: Record.remove,
 * enable: ((function(*, *): Promise<void>)|*),
 * changeQuality: ((function(*, *): Promise<void>)|*),
 * off(string<Events_List>, Function): (undefined|this),
 * on(string<Events_List>, Function): (undefined|this)
 * }}
 */
const Record = {

    EVENTS_LIST,
    ERRORS,

    init: async function init(Devices) {
        this._Events = Object.create(Events).init();
        this._Devices = Devices;

        this._LSSaver = Object.create(LocalStorageSaver).init(
            LS_SAVE_INFO_NAME,
            SAVE_VERSION,
            DEFAULT_SAVE,
        );

        const
            savedData = this._LSSaver.load();

        this._store = {
            quality: savedData.quality,
            volume: savedData.volume,
            muted: savedData.muted,
            uploadMode: savedData.uploadMode,
            enabled: {
                [SETTINGS_NAMES.AUDIO_TYPE]: this._Devices.inputAudioStatus === DEVICES_STATUS.ON,
                [SETTINGS_NAMES.VIDEO_TYPE]: this._Devices.inputVideoStatus === DEVICES_STATUS.ON,
            }
        };

        this._streams = {
            [SETTINGS_NAMES.AUDIO_TYPE]: null,
            [SETTINGS_NAMES.VIDEO_TYPE]: null,
        };

        this._Devices.on(EVENTS_LIST.DEVICE_INPUT_CHANGE, this._handleDevicesChange.bind(this));
        this._Devices.on(EVENTS_LIST.DEVICE_INPUT_STATUS_CHANGE, this._handleDeviceStatusChanged.bind(this));

        return this;
    },


    _changeQuality: function _changeQuality(mediaType, quality) {
        if (typeof mediaType !== 'string'
            && mediaType !== SETTINGS_NAMES.VIDEO_TYPE
            && mediaType !== SETTINGS_NAMES.AUDIO_TYPE) {
            console.warn(`${LABEL} | Incorrect Record Track Type`);
            return false;
        }

        const
            isQualitySupported = this._checkQuality(mediaType, quality);

        if ( isQualitySupported ) {
            this._store.quality[mediaType] = quality;
            this._LSSaver.save(
                this._store.quality[mediaType],
                DIRECTORY.quality,
                mediaType
            );
        }

        return isQualitySupported;
    },


    _checkQuality: function _checkQuality(mediaType, quality=null) {
        const
            device =  mediaType === SETTINGS_NAMES.AUDIO_TYPE
                ? this._Devices.inputAudioDevice : this._Devices.inputVideoDevice;

        if ( !quality || !device ) return false;

        // Hack for mozilla
        // TODO: Added global flag (ex.: browser name)
        if ( !device?.getCapabilities ) return true;

        const
            capabilities = device?.getCapabilities && device?.getCapabilities();


        const
            qualityConstraints = mediaType === SETTINGS_NAMES.VIDEO_TYPE
                ? QUALITY_VIDEO_PRESETS[quality] : QUALITY_AUDIO_PRESETS[quality];

        function checkVideoQuality(quality, capabilities) {
            const
                {
                    width: {
                        max: maxWidth,
                        min: minWidth,
                    },
                    height: {
                        max: maxHeight,
                        min: minHeight,
                    },
                    frameRate: {
                        max: maxFPS,
                    }
                } = capabilities;

            const
                isWidthOk = quality?.width?.ideal && (quality.width.ideal >= minWidth && quality.width.ideal <= maxWidth),
                isHeightOk = quality?.height?.ideal && (quality.height.ideal >= minHeight && quality.height.ideal <= maxHeight),
                isFrameRateOk = quality?.frameRate && quality.frameRate <= maxFPS;

            return isWidthOk && isHeightOk && isFrameRateOk;
        }

        // TODO: Check about sampleSize
        function checkAudioQuality(quality, capabilities) {

            const
                {
                    sampleRate: {
                        min: minSampleRate,
                        max: maxSampleRate,
                    },
                    channelCount: {
                        min: minChannelCount,
                        max: maxChannelCount,
                    }
                } = capabilities;

            const
                isSampleRateOk = quality?.sampleRate && (quality?.sampleRate >= minSampleRate && quality?.sampleRate <= maxSampleRate),
                isChannelCountOk = quality?.channelCount && (quality?.channelCount >= minChannelCount && quality?.channelCount <= maxChannelCount);

            return isSampleRateOk && isChannelCountOk;
        }

        return mediaType === SETTINGS_NAMES.AUDIO_TYPE
            ? checkAudioQuality(qualityConstraints, capabilities)
            : checkVideoQuality(qualityConstraints, capabilities);
    },


    _clearStream: function _clearStream(mediaType) {
        this._streams[mediaType]?.getTracks().forEach(track => {
            track.stop();
            this._streams[mediaType].removeTrack(track);
        });
        this._streams[mediaType] = null;
    },


    _createTrack: async function _createTrack(mediaType) {
        const
            currentDevice = mediaType === SETTINGS_NAMES.AUDIO_TYPE
                ? this._Devices.inputAudioDevice
                : this._Devices.inputVideoDevice;

        if ( !currentDevice ) {
            return {
                track: null,
                reason: ERRORS.NO_INPUT_DEVICE
            };
        }

        const
            quality = this._getQuality(mediaType, this._store.quality[mediaType]),
            qualityConstraints = getConstraintsQuality(mediaType, quality);

        this._changeQuality(mediaType, quality);

        const
            constraints = {
                [SETTINGS_NAMES.AUDIO_TYPE]: false,
                [SETTINGS_NAMES.VIDEO_TYPE]: false,
                [mediaType]: {
                    ...qualityConstraints,
                    deviceId: { exact: currentDevice.deviceId },
                }
            };

        mediaType === SETTINGS_NAMES.AUDIO_TYPE &&
            (constraints[mediaType].volume = this._store.volume);

        try {
            this._clearStream(mediaType);

            const
                stream = await navigator.mediaDevices.getUserMedia(constraints);

            if ( !stream ) {
                throw new Error('MediaStream not found');
            }

            this._streams[mediaType] = stream;

            return {
                track: stream,
                reason: '',
            };
        } catch(error) {
            console.error(error);

            return {
                track: null,
                reason: error.message,
            };
        }
    },


    _getQuality: function _getQuality(mediaType, quality) {
        const
            QUALITY_LIST = mediaType === SETTINGS_NAMES.VIDEO_TYPE
                ? QUALITY_VIDEO_PRESETS : QUALITY_AUDIO_PRESETS;

        const
            maxAvailableQuality = Object.keys(QUALITY_LIST).reduce((currentQuality, key) => {
                return this._checkQuality(mediaType, key)
                    ? key
                    : currentQuality;
            }, null);

        return Object.keys(QUALITY_LIST).indexOf(quality) > -1 && this._checkQuality(mediaType, quality)
            ? quality
            : maxAvailableQuality;
    },


    _handleDevicesChange: async function _handleDevicesChange({ mediaType, device }) {
        if ( !device?.deviceId ) return;

        const { track } = await this._createTrack(mediaType);

        await this._changeQuality(mediaType, this._store.quality[mediaType]);

        if (track) {
            this._Events.notify(EVENTS_LIST.RECORD_TRACK_CHANGED, {
                mediaType,
                track,
            });
        }
    },


    _handleDeviceStatusChanged: async function _handleDeviceStatusChanged({ mediaType, status }) {
        await this.enable(mediaType, status === DEVICES_STATUS.ON);
    },


    _setTrackVolume: async function _setTrackVolume(volumeLevel) {
        const
            mediaStream = (await this._getTrack(SETTINGS_NAMES.AUDIO_TYPE))?.track;

        if (!mediaStream) {
            console.warn('The record track not found', {
                cause: ERRORS.BROADCAST_TRACK_NOT_FOUND
            });
            return;
        }

        this._store.volume = volumeLevel;
        // TODO: Add real change volume

        this._LSSaver.save(
            volumeLevel,
            DIRECTORY.volume,
        );

        this._Events.notify(EVENTS_LIST.VOLUME_CHANGE, {
            volume: volumeLevel
        });
    },


    _setTrackMuted: async function _setTrackMuted(isMuted) {
        if (typeof isMuted !== 'boolean') {
            console.warn(`${LABEL} | Incorrect Record Mute Value`);
            return;
        }

        const
            mediaStream = (await this._getTrack(SETTINGS_NAMES.AUDIO_TYPE))?.track;

        if (!mediaStream) {
            console.warn('The record track not found', {
                cause: ERRORS.RECORD_TRACK_NOT_FOUND
            });
            return;
        }

        const
            mediaStreamTrack = mediaStream.getAudioTracks()[0];

        mediaStreamTrack.enabled = isMuted;
        this._store.muted = isMuted;

        this._LSSaver.save(
            isMuted,
            DIRECTORY.muted,
        );


        this._Events.notify(EVENTS_LIST.RECORD_MUTE_STATUS_CHANGE, {
            muted: isMuted
        });
    },


    get volume() {
        return this._store.volume;
    },

    get muted() {
        return this._store.muted;
    },

    get quality() {
        return this._store.quality;
    },

    get enabled() {
        return this._store.enabled;
    },

    get enabledAudio() {
        return this._store.enabled[SETTINGS_NAMES.AUDIO_TYPE];
    },

    get enabledVideo() {
        return this._store.enabled[SETTINGS_NAMES.VIDEO_TYPE];
    },

    get uploadMode() {
        return this._store.uploadMode;
    },

    set uploadMode(status) {
        this._store.uploadMode = !!status;

        this._LSSaver.save(
            this._store.uploadMode,
            DIRECTORY.uploadMode,
        );
        this._Events.notify(EVENTS_LIST.RECORD_UPLOAD_MODE_CHANGED, {
            status: this._store.uploadMode,
        });
    },

    changeQuality: async function changeQuality(mediaType, quality) {
        const
            isQualityChanged = this._changeQuality(mediaType, quality);

        if (isQualityChanged) {
            const
                quality = this._getQuality(mediaType, this._store.quality[mediaType]),
                qualityConstraints = getConstraintsQuality(mediaType, quality);

            await this._streams[mediaType].getTracks()[0].applyConstraints(qualityConstraints);

            this._Events.notify(EVENTS_LIST.RECORD_QUALITY_CHANGE, {
                mediaType,
                quality
            });
        }
    },

    getTrack: async function getTrack(mediaType) {
        const
            track = this._streams[mediaType],
            reason = '';

        if ( !track ) {
            return this._createTrack(mediaType);
        }

        return {track, reason};
    },

    setVolume: async function setVolume(volumeLevel) {
        if (typeof volumeLevel !== 'number' || volumeLevel < 0 || volumeLevel > 1000) {
            console.warn(`${LABEL} | incorrect volume value`);
            return;
        }

        await this._setTrackVolume(volumeLevel);
    },

    enable: async function enable(mediaType, status) {
        if (typeof status !== 'boolean'
            || (mediaType !== SETTINGS_NAMES.VIDEO_TYPE && mediaType !== SETTINGS_NAMES.AUDIO_TYPE)
        ) {
            console.warn(`${LABEL} | Incorrect Record Mute Value`);
            return;
        }

        const
            mediaStream = this._streams[mediaType] || (await this.getTrack(mediaType)).track;

        this._store.enabled[mediaType] = status;

        if ( !mediaStream ) {
            console.warn('The record track not found', {
                cause: ERRORS.RECORD_TRACK_NOT_FOUND
            });
            return;
        }

        const
            mediaStreamTrack = mediaType === SETTINGS_NAMES.AUDIO_TYPE
                ? mediaStream.getAudioTracks()[0] : mediaStream.getVideoTracks()[0];

        mediaStreamTrack.enabled = status;

        this._Events.notify(EVENTS_LIST.RECORD_ENABLE_CHANGE, {
            mediaType,
            status,
        });
    },

    mute: async function mute(mediaType, isMuted) {
        await this._setTrackMuted(mediaType, isMuted);
    },

    remove: function remove() {
        const
            audioStreamTracks = this._streams[SETTINGS_NAMES.AUDIO_TYPE]?.getTracks() || [],
            videoStreamTracks = this._streams[SETTINGS_NAMES.VIDEO_TYPE]?.getTracks() || [];

        audioStreamTracks.forEach(track => track.stop());
        videoStreamTracks.forEach(track => track.stop());
    },

    /**
     * Unsubscribe from an event
     *
     * @author Artem Stepanov <artyom.stepanov@openmedia.co>
     * @version v0.1.0
     * @since v0.1.0
     *
     * @param {string<Events_List>} event - Specified event from EVENTS_LIST
     * @param {function} callback - Callback functions handling the event
     */
    off(event, callback) {
        try {
            if (typeof event !== 'string') {
                console.warn(`${LABEL} | type of event is not string.`);
                return;
            }
            if (!(callback instanceof Function)) {
                console.warn(`${LABEL} | type of callback is not function.`);
                return;
            }
            if (!existEvent(event)) {
                console.warn(`${LABEL} | Event not found.`);
                return;
            }

            this._Events.remove(event, callback);

        } catch (error) {
            console.error(error);
            throw new Error(error);
        }

        return this;
    },

    /**
     * Subscribe to the event
     *
     * @author Artem Stepanov <artyom.stepanov@openmedia.co>
     * @version v0.1.0
     * @since v0.1.0
     *
     * @param {string<Events_List>} event - Specified event from Events List
     * @param {function} callback - Callback functions handling the event
     */
    on(event, callback) {
        try {
            if (!existEvent(event)) {
                console.warn(`${LABEL} | Event not found.`);
                return;
            }

            this._Events.add(event, callback);
        } catch (error) {
            console.error(error);
            throw new Error(error);
        }

        return this;
    },
};

export default Record;