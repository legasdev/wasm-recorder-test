import SETTINGS_NAMES from "./settingsNames";
import {
    QualityRecordAudioPresets as QUALITY_AUDIO_PRESETS,
    QualityRecordVideoPresets as QUALITY_VIDEO_PRESETS
} from "@modules/settings/utils/qualityPresets";

const DEFAULT_QUALITY_RECORD = {
    [SETTINGS_NAMES.AUDIO_TYPE]: QUALITY_AUDIO_PRESETS.music_standard,
    [SETTINGS_NAMES.VIDEO_TYPE]: QUALITY_VIDEO_PRESETS["480p_2"],
};

export { DEFAULT_QUALITY_RECORD };