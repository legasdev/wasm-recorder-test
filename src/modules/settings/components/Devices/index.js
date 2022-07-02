import Events from "events-om";
import LocalStorageSaver from "@modules/local-storage-saver";

import {existEvent} from "@modules/settings/utils";

import DEVICES_STATUS from "@modules/settings/utils/devicesStatus";
import SETTINGS_NAMES from "@modules/settings/utils/settingsNames";
import {DEVICES_ERROR_TYPES} from "@modules/settings/utils/devicesErrorTypes";
import EVENTS_LIST from "@modules/settings/utils/eventsList";

import {
    LABEL,
    LS_SAVE_INFO_NAME,
    SAVE_VERSION,
    DEFAULT_SAVE,
    TIMEOUT_FOR_PREPARE_DEVICE,
    DIRECTORY,
    DEVICE_CHANGE_EVENT
} from "@modules/settings/components/Devices/constants";


/**
 * @interface Devices
 * @version 1.0.0
 *
 * @type {{
 *     _Events: (Events|null)
 * }}
 */
const Devices = {

    _Events: null,

    init: async function init() {
        this._Events = Object.create(Events).init();
        this._LSSaver = Object.create(LocalStorageSaver).init(
            LS_SAVE_INFO_NAME,
            SAVE_VERSION,
            DEFAULT_SAVE,
        );

        this._devicesStatus = {
            [SETTINGS_NAMES.INPUT]: {
                [SETTINGS_NAMES.AUDIO_TYPE]: DEVICES_STATUS.PREPARE,
                [SETTINGS_NAMES.VIDEO_TYPE]: DEVICES_STATUS.PREPARE,
            },
            [SETTINGS_NAMES.OUTPUT]: {
                [SETTINGS_NAMES.AUDIO_TYPE]: DEVICES_STATUS.PREPARE,
                [SETTINGS_NAMES.VIDEO_TYPE]: DEVICES_STATUS.PREPARE,
            },
        };

        this._devicesList = {
            [SETTINGS_NAMES.INPUT]: {
                [SETTINGS_NAMES.AUDIO_TYPE]: null,
                [SETTINGS_NAMES.VIDEO_TYPE]: null,
            },
            [SETTINGS_NAMES.OUTPUT]: {
                [SETTINGS_NAMES.AUDIO_TYPE]: null,
                [SETTINGS_NAMES.VIDEO_TYPE]: null,
            },
        };

        this._currentDevices = {
            [SETTINGS_NAMES.INPUT]: {
                [SETTINGS_NAMES.AUDIO_TYPE]: null,
                [SETTINGS_NAMES.VIDEO_TYPE]: null,
            },
            [SETTINGS_NAMES.OUTPUT]: {
                [SETTINGS_NAMES.AUDIO_TYPE]: null,
                [SETTINGS_NAMES.VIDEO_TYPE]: null,
            },
        };

        // Check permissions
        await this._checkPermission(SETTINGS_NAMES.AUDIO_TYPE);
        await this._checkPermission(SETTINGS_NAMES.VIDEO_TYPE);

        // Update devices list
        await this._handleDeviceChange();

        this._setCurrentDevices(SETTINGS_NAMES.AUDIO_TYPE);
        this._setCurrentDevices(SETTINGS_NAMES.VIDEO_TYPE);

        navigator?.mediaDevices?.addEventListener(DEVICE_CHANGE_EVENT, this._handleDeviceChange.bind(this));

        return this;
    },


    _checkPermission: async function _checkPermission(mediaType) {
        const
            constraints = mediaType === SETTINGS_NAMES.AUDIO_TYPE
                ? {audio: true, video: false} : {audio: false, video: true};

        let timeout = setTimeout(() => {
            this._changeDeviceStatus(mediaType, DEVICES_STATUS.NOT_READABLE);
        }, TIMEOUT_FOR_PREPARE_DEVICE);

        try {
            let stream = await navigator.mediaDevices.getUserMedia(constraints);

            stream.getTracks().forEach(track => {
                track?.stop();
                stream.removeTrack(track);
            });
            stream = null;

            this._changeDeviceStatus(mediaType, DEVICES_STATUS.ON);

        } catch (error) {
            const { name } = error;

            switch (name) {
                case DEVICES_ERROR_TYPES.notAllowedError:
                    this._changeDeviceStatus(mediaType, DEVICES_STATUS.NOT_ALLOWED);
                    break;

                case DEVICES_ERROR_TYPES.notFoundError:
                    this._changeDeviceStatus(mediaType, DEVICES_STATUS.NOT_FOUND);
                    break;

                case DEVICES_ERROR_TYPES.notReadableError:
                    this._changeDeviceStatus(mediaType, DEVICES_STATUS.NOT_READABLE);
                    break;

                case DEVICES_ERROR_TYPES.overconstrainedError:
                    this._changeDeviceStatus(mediaType, DEVICES_STATUS.OVERCONSTRAINED);
                    break;

                case DEVICES_ERROR_TYPES.securityError:
                    this._changeDeviceStatus(mediaType, DEVICES_STATUS.SECURITY_ERROR);
                    break;

                case DEVICES_ERROR_TYPES.typeError:
                    this._changeDeviceStatus(mediaType, DEVICES_STATUS.TYPE_ERROR);
                    break;

                default:
                    this._changeDeviceStatus(mediaType, DEVICES_STATUS.ON);
            }
        }

        clearTimeout(timeout);
        timeout = null;
    },


    /**
     *
     * @param mediaType
     * @param {string} status
     * @param deviceType
     * @private
     */
    _changeDeviceStatus: function _changeDeviceStatus(mediaType, status, deviceType = SETTINGS_NAMES.INPUT) {
        if ( !Object.values(DEVICES_STATUS).includes(status) ) {
            console.warn(`Attempt to set unknown device status: ${status}`);
            return;
        }

        const
            event = deviceType === SETTINGS_NAMES.INPUT
                ? EVENTS_LIST.DEVICE_INPUT_STATUS_CHANGE : EVENTS_LIST.DEVICE_OUTPUT_STATUS_CHANGE;

        this._devicesStatus[deviceType][mediaType] = status;

        this._LSSaver.save(
            status,
            DIRECTORY.enabled,
            mediaType
        );

        this._Events.notify(event, {
            deviceType,
            mediaType,
            status
        });
    },


    _getDeviceById: function _getDeviceById(mediaType, deviceType = SETTINGS_NAMES.INPUT, deviceId=null) {
        if ( !deviceId ) return '';
        return this._devicesList[deviceType][mediaType].find(device => device.deviceId === deviceId)?.deviceId;
    },


    /**
     * @description
     * Returns a list of devices. Can be filtered by constraints
     *
     * @async
     * @param {object|null} constraints
     * @returns {Promise<array<object>>}
     *
     * @private
     */
    _getDevicesList: async function _getDevicesList(constraints=null) {
        const
            userDevices = await navigator.mediaDevices.enumerateDevices();

        if ( !constraints ) {
            return userDevices;
        }

        return userDevices.filter(device => device.kind === constraints.kind);
    },


    _handleDeviceChange: async function _handleDeviceChange() {

        async function updateDevices(mediaType) {
            await this._checkPermission(mediaType);
            await this._updateDevicesList(mediaType);
            this._setCurrentDevices(mediaType);
        }

        await updateDevices.call(this, SETTINGS_NAMES.AUDIO_TYPE);
        await updateDevices.call(this, SETTINGS_NAMES.VIDEO_TYPE);
    },


    _normalizeStatus: function _normalizeStatus(status) {
        return typeof status !== 'boolean'
            ? status
            : status ? DEVICES_STATUS.ON : DEVICES_STATUS.OFF;
    },


    _setCurrentDevices: function _setCurrentDevices(mediaType, deviceId = null, deviceType = SETTINGS_NAMES.INPUT) {
        const
            deviceList = this._devicesList[deviceType][mediaType],
            deviceStatus = this._devicesStatus[deviceType][mediaType],
            isDeviceAvailable =
                deviceStatus === DEVICES_STATUS.OFF
                || deviceStatus === DEVICES_STATUS.ON
                || deviceStatus === DEVICES_STATUS.PROMPT;

        if ( !isDeviceAvailable ) {
            return;
        }

        this._currentDevices[deviceType][mediaType] =
            this._getDeviceById(mediaType, deviceType, deviceId)
            || deviceList[0]?.deviceId
            || null;

        const
            event = deviceType === SETTINGS_NAMES.INPUT
                ? EVENTS_LIST.DEVICE_INPUT_CHANGE : EVENTS_LIST.DEVICE_OUTPUT_CHANGE;

        this._Events.notify(event, {
            deviceType,
            mediaType,
            device: deviceList.find(({ deviceId }) => deviceId === this._currentDevices[deviceType][mediaType]),
        });
    },


    _updateDevicesList: async function _updateDevicesList(mediaType, deviceType = SETTINGS_NAMES.INPUT) {
        const
            currentDeviceStatus = this._devicesStatus[deviceType][mediaType];


        if ( currentDeviceStatus === DEVICES_STATUS.NOT_ALLOWED
            || currentDeviceStatus === DEVICES_STATUS.SECURITY_ERROR
        ) {
            console.warn(`${mediaType === SETTINGS_NAMES.AUDIO_TYPE
                ? 'Audio' : 'Video'} device access denied by user settings`);
            return;
        }

        const
            kindDevice = deviceType === SETTINGS_NAMES.INPUT
                ? mediaType === SETTINGS_NAMES.AUDIO_TYPE
                    ? SETTINGS_NAMES.AUDIO_INPUT_TYPE
                    : SETTINGS_NAMES.VIDEO_INPUT_TYPE
                : mediaType === SETTINGS_NAMES.AUDIO_TYPE
                    ? SETTINGS_NAMES.AUDIO_OUTPUT_TYPE
                    : SETTINGS_NAMES.VIDEO_OUTPUT_TYPE,

            devicesList = (await this._getDevicesList())
                .filter(device => device.kind === kindDevice);

        /**
         * @description
         * Compares lists of devices to determine changes in the current list.
         *
         * @param currentDevices
         * @param updatedDevices
         * @return {boolean} true - There was a change / false - No changes happened
         */
        const compareDevices = (currentDevices, updatedDevices) => {
            this._checkDevicesAvaliability(currentDevices, updatedDevices, deviceType, mediaType);  

            if (currentDevices?.length !== updatedDevices?.length) {
                return true;
            }

            const c = updatedDevices.map(device => {
                return !currentDevices.find(item => item.deviceId === device.deviceId);
            });

            return c.includes(true);
        }

        const
            listIdentityStatus = compareDevices(this._devicesList[deviceType][mediaType], devicesList),

            event = deviceType === SETTINGS_NAMES.INPUT
                ? EVENTS_LIST.DEVICES_INPUT_LIST_CHANGE : EVENTS_LIST.DEVICES_OUTPUT_LIST_CHANGE;

        if ( !listIdentityStatus ) {
            return;
        }

        this._devicesList = {
            ...this._devicesList,
            [deviceType]: {
                ...this._devicesList[deviceType],
                [mediaType]: devicesList,
            },
        };

        this._Events.notify(event, {
            deviceType,
            mediaType,
            devices: devicesList,
        });
    },


    _checkDevicesAvaliability: function _checkDevicesAvaliability(currentDevices, updatedDevices, deviceType, mediaType) {
      const
          isDeviceListDifferent = currentDevices?.length > updatedDevices?.length || (currentDevices && updatedDevices === null),
          isDevicesMissing = updatedDevices === null || updatedDevices?.length === 0 || updatedDevices?.length === 1;

      if (isDeviceListDifferent && isDevicesMissing) {
          this._Events.notify(EVENTS_LIST.DEVICES_ACTIVE_DEVICE_DISCONNECTED, {
              deviceType,
              mediaType,
          });
      }
    },


    get inputAudioDevice() {
        const
            devices = this._devicesList[SETTINGS_NAMES.INPUT][SETTINGS_NAMES.AUDIO_TYPE],
            currentDeviceId = this._currentDevices[SETTINGS_NAMES.INPUT][SETTINGS_NAMES.AUDIO_TYPE];

        return devices?.find(({deviceId}) => deviceId === currentDeviceId) || null;
    },

    get outputAudioDevice() {
        const
            devices = this._devicesList[SETTINGS_NAMES.OUTPUT][SETTINGS_NAMES.AUDIO_TYPE],
            currentDeviceId = this._currentDevices[SETTINGS_NAMES.OUTPUT][SETTINGS_NAMES.AUDIO_TYPE];

        return devices?.find(({deviceId}) => deviceId === currentDeviceId) || null;
    },

    get inputVideoDevice() {
        const
            devices = this._devicesList[SETTINGS_NAMES.INPUT][SETTINGS_NAMES.VIDEO_TYPE],
            currentDeviceId = this._currentDevices[SETTINGS_NAMES.INPUT][SETTINGS_NAMES.VIDEO_TYPE];

        return devices?.find(({deviceId}) => deviceId === currentDeviceId) || null;
    },

    get outputVideoDevice() {
        const
            devices = this._devicesList[SETTINGS_NAMES.OUTPUT][SETTINGS_NAMES.VIDEO_TYPE],
            currentDeviceId = this._currentDevices[SETTINGS_NAMES.OUTPUT][SETTINGS_NAMES.VIDEO_TYPE];

        return devices?.find(({deviceId}) => deviceId === currentDeviceId) || null;
    },

    get devices() {
        return this._devicesList;
    },

    get inputDevices() {
        return this._devicesList[SETTINGS_NAMES.INPUT];
    },

    get outputDevices() {
        return this._devicesList[SETTINGS_NAMES.OUTPUT];
    },

    get inputAudioDevices() {
        return this._devicesList[SETTINGS_NAMES.INPUT][SETTINGS_NAMES.AUDIO_TYPE];
    },

    get outputAudioDevices() {
        return this._devicesList[SETTINGS_NAMES.OUTPUT][SETTINGS_NAMES.AUDIO_TYPE];
    },

    get inputVideoDevices() {
        return this._devicesList[SETTINGS_NAMES.INPUT][SETTINGS_NAMES.VIDEO_TYPE];
    },

    get outputVideoDevices() {
        return this._devicesList[SETTINGS_NAMES.OUTPUT][SETTINGS_NAMES.VIDEO_TYPE];
    },

    get statuses() {
        return this._devicesStatus;
    },

    get inputAudioStatus() {
        return this._devicesStatus[SETTINGS_NAMES.INPUT][SETTINGS_NAMES.AUDIO_TYPE];
    },

    get outputAudioStatus() {
        return this._devicesStatus[SETTINGS_NAMES.OUTPUT][SETTINGS_NAMES.AUDIO_TYPE];
    },

    get inputVideoStatus() {
        return this._devicesStatus[SETTINGS_NAMES.INPUT][SETTINGS_NAMES.VIDEO_TYPE];
    },

    get outputVideoStatus() {
        return this._devicesStatus[SETTINGS_NAMES.OUTPUT][SETTINGS_NAMES.VIDEO_TYPE];
    },

    set inputAudioDevice(deviceId) {
        this._setCurrentDevices(SETTINGS_NAMES.AUDIO_TYPE, deviceId);
    },

    set outputAudioDevice(deviceId) {
        this._setCurrentDevices(SETTINGS_NAMES.AUDIO_TYPE, deviceId, SETTINGS_NAMES.OUTPUT);
    },

    set inputVideoDevice(deviceId) {
        this._setCurrentDevices(SETTINGS_NAMES.VIDEO_TYPE, deviceId);
    },

    set outputVideoDevice(deviceId) {
        this._setCurrentDevices(SETTINGS_NAMES.VIDEO_TYPE, deviceId, SETTINGS_NAMES.OUTPUT);
    },

    /**
     *
     * @param {boolean|string.<DEVICES_STATUS>} status
     */
    set inputAudioStatus(status) {
        this._changeDeviceStatus(
            SETTINGS_NAMES.AUDIO_TYPE,
            this._normalizeStatus(status)
        );
    },

    set outputAudioStatus(status) {
        this._changeDeviceStatus(SETTINGS_NAMES.AUDIO_TYPE, status, SETTINGS_NAMES.OUTPUT);
    },

    /**
     *
     * @param {boolean|string.<DEVICES_STATUS>} status
     */
    set inputVideoStatus(status) {
        this._changeDeviceStatus(
            SETTINGS_NAMES.VIDEO_TYPE,
            this._normalizeStatus(status)
        );
    },

    set outputVideoStatus(status) {
        this._changeDeviceStatus(SETTINGS_NAMES.VIDEO_TYPE, status, SETTINGS_NAMES.OUTPUT);
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

export default Devices;