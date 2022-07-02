import EVENTS_LIST from "./eventsList";

/**
 * @namespace Utils
 *
 * @description
 * Common functions and methods to help work inside react components and hooks
 * @since v0.1.0-alpha.3
 */

/**
 * @description
 * Determines if a given event exists in the SDK
 *
 * @memberOf Utils
 * @author Artem Stepanov <artyom.stepanov@openmedia.co>
 * @version v0.1.0-alpha.3
 * @since v0.1.0-alpha.3
 * @access package
 *
 * @param {String} [event=''] - Event name
 * @return {boolean} If the event exists, it will return true
 */
const
    existEvent = (event='') => !!Object.values(EVENTS_LIST).find(eventName => eventName === event);

export {existEvent};