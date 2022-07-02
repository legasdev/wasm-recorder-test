import SETTINGS_NAMES from "./settingsNames";
import {
    QualityRecordAudioPresets as QUALITY_AUDIO_PRESETS,
    QualityRecordVideoPresets as QUALITY_VIDEO_PRESETS
} from "@modules/settings/utils/qualityPresets";


function getConstraintsQuality(mediaType, quality) {
    return mediaType === SETTINGS_NAMES.VIDEO_TYPE
        ? QUALITY_VIDEO_PRESETS[quality] : QUALITY_AUDIO_PRESETS[quality];
}

const RATIO_16d9 = 1.7777777777777777;
const STANDARD_HEIGHTS = [360, 720, 1080, 1440, 2160, 2880, 4320, 8640];
const STANDARD_FRAME_RATE = 30;

export async function getConstraints(track, maxConstrains) {
    const {height} = maxConstrains;
    const frameRate = STANDARD_FRAME_RATE;
    const reducedHeights = STANDARD_HEIGHTS.reduce((arr, i) => {
        if (i <= height) {
            arr.push(i);
        }
        return arr;
    }, []);

    const constrains = reducedHeights.reduce(async (pr, curHeight) => {
        const arr = await pr;
        try {
            const curWidth = curHeight * RATIO_16d9;
            await track.applyConstraints({width: curWidth, curHeight, frameRate});
            arr.push({width: curWidth, height: curHeight, frameRate});
            // eslint-disable-next-line no-empty
        } catch (e) {}
        return arr;
    }, Promise.resolve([]));

    return constrains;
}

export { getConstraintsQuality };
