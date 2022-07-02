/**
 * @namespace EventsList
 * @description
 * Collection of events inside the module. To subscribe to selected events, use the "on" method from the "useBroadcast" hook.
 * To unsubscribe from an event, use the "off" method from the "useBroadcast" hook.
 *
 * @since v0.1.0
 */

/**
 * @description
 * List of events that occur inside agora sdk.
 *
 * @memberOf EventsList
 * @author Anton Samanov <anton.samanov@openmedia.co>
 * @version v0.1.4
 * @since v0.1.0-alpha
 * @access public
 *
 * @property {string} VOLUME_CHANGE - The moment when a remote user joins a video conference
 * @property {string} CHANGE_OPTIMIZATION_MODE - The moment when a remote user publishes his media data (video or audio)
 * @property {string} BROADCAST_QUALITY_CHANGE - Event of changing the selected quality for online communication
 * @property {string} BROADCAST_MUTE_STATUS_CHANGE - Video Mute Change Event for online communication
 * @property {string} BROADCAST_ENABLE_CHANGE - Stream activity change event for online communication
 * @property {string} BROADCAST_TRACK_CHANGED -
 * @property {string} RECORD_QUALITY_CHANGE - Event of changing the selected quality for video recording
 * @property {string} RECORD_MUTE_STATUS_CHANGE - Video Mute Change Event for record
 * @property {string} RECORD_ENABLE_CHANGE - Stream activity change event for record
 * @property {string} RECORD_TRACK_CHANGED -
 * @property {string} RECORD_UPLOAD_MODE_CHANGED -
 * @property {string} DEVICE_INPUT_CHANGE - The selected input device has changed
 * @property {string} DEVICE_INPUT_STATUS_CHANGE -
 * @property {string} DEVICE_OUTPUT_CHANGE - The selected output device has changed
 * @property {string} DEVICE_OUTPUT_STATUS_CHANGE -
 * @property {string} DEVICES_INPUT_LIST_CHANGE - The list of available input devices has changed
 * @property {string} DEVICES_OUTPUT_LIST_CHANGE - The list of available output devices has changed
 * @property {string} DEVICES_ACTIVE_DEVICE_DISCONNECTED - Occurs when the active device disconnected and user doesn't have another
 *
 */
const EVENTS_LIST = {
    VOLUME_CHANGE: 'volume-changed',
    CHANGE_OPTIMIZATION_MODE: 'change-optimization-mode',
    BROADCAST_QUALITY_CHANGE: 'broadcast-quality-change',
    BROADCAST_ENABLE_CHANGE: 'broadcast-enable-change',
    BROADCAST_MUTE_STATUS_CHANGE: 'broadcast-mute-status-change',
    BROADCAST_TRACK_CHANGED: 'broadcast-track-changed',
    RECORD_QUALITY_CHANGE: 'record-quality-change',
    RECORD_MUTE_STATUS_CHANGE: 'record-mute-status-change',
    RECORD_ENABLE_CHANGE: 'record-enable-change',
    RECORD_TRACK_CHANGED: 'record-track-changed',
    RECORD_UPLOAD_MODE_CHANGED: 'record-upload-mode-changed',
    DEVICE_INPUT_CHANGE: 'input-device-change',
    DEVICE_INPUT_STATUS_CHANGE: 'device-input-status-change',
    DEVICE_OUTPUT_CHANGE: 'output-device-change',
    DEVICE_OUTPUT_STATUS_CHANGE: 'device-output-status-change',
    DEVICES_INPUT_LIST_CHANGE: 'devices-input-list-change',
    DEVICES_OUTPUT_LIST_CHANGE: 'devices-output-list-change',
    DEVICES_ACTIVE_DEVICE_DISCONNECTED: 'devices-active-device-disconnected',
};

export default EVENTS_LIST;