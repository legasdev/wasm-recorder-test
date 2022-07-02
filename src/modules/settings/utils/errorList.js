/**
 * @namespace Errors
 * @description
 * Collection of errors inside the common module.
 *
 * @since v0.1.1
 */

/**
 * @description
 * List of errors that occur inside common module.
 *
 * @memberOf Errors
 * @author Anton Samanov <anton.samanov@openmedia.co>
 * @version v0.1.0
 * @since v0.1.0
 * @access public
 *
 * @property {string} BROADCAST_TRACK_NOT_FOUND - The broadcast track isn't created yet
 * @property {string} RECORD_TRACK_NOT_FOUND - The record track isn't created yet
 * @property {string} RECORD_QUALITY_BAD -
 * @property {string} NO_INPUT_DEVICE - No input device available
 *
 */

const ERROR_LIST = {
    BROADCAST_TRACK_NOT_FOUND: 'broadcast-track-not-found',
    RECORD_TRACK_NOT_FOUND: 'record-track-not-found',
    RECORD_QUALITY_BAD: 'record-quality-bad',
    NO_INPUT_DEVICE: 'no-input-device'
};

export default ERROR_LIST;