/**
 * @namespace Devices_Status
 *
 * @since v0.1.9
 */

/**
 * @description
 * List of possible statuses for connected devices and browser permissions.
 *
 * @memberOf Devices_Status
 * @author Artem Stepanov <artyom.stepanov@openmedia.co>
 * @version v0.1.9
 * @since v0.1.9
 * @access public
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia#exceptions
 *
 * @property {string} PREPARE
 * @property {string} ON
 * @property {string} OFF
 * @property {string} PROMPT
 * @property {string} ABORT
 * @property {string} NOT_ALLOWED
 * @property {string} NOT_FOUND
 * @property {string} NOT_READABLE
 * @property {string} OVERCONSTRAINED
 * @property {string} SECURITY_ERROR
 * @property {string} TYPE_ERROR
 * @property {string} UNKNOWN
 */
const DEVICES_STATUS = {
    PREPARE: 'Prepare',
    ON: 'Enabled',
    OFF: 'Disabled',
    PROMPT: 'Prompt',
    ABORT: 'AbortError',
    NOT_ALLOWED: 'NotAllowedError',
    NOT_FOUND: 'NotFoundError',
    NOT_READABLE: 'NotReadableError',
    OVERCONSTRAINED: 'OverconstrainedError',
    SECURITY_ERROR: 'SecurityError',
    TYPE_ERROR: 'TypeError',
    UNKNOWN: 'Unknown',
};

export default DEVICES_STATUS;