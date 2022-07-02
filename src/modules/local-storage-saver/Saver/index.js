
const Saver = {

    init: function init(name, version, defaultData=null) {
        this._name = name;
        this._version = version;

        this._DEFAULT_SAVE = defaultData;

        this._checkActualSaveVersion();

        return this;
    },


    _checkActualSaveVersion: function _checkActualSaveVersion() {
        const
            actualData = this._getDataFromStorage();

        if ( !actualData ) {
            this._setDataToStorage(this._DEFAULT_SAVE);
            return;
        }

        if ( actualData?.version !== this._version ) {
            this._setDataToStorage({
                ...this._DEFAULT_SAVE,
                ...actualData,
                version: this._version,
            });
        }
    },

    _getDataFromStorage: function _getDataFromStorage() {
        return JSON.parse(localStorage.getItem(this._name)) || null;
    },

    _makeDataToSave: function _makeDataToSave(dataToSave, savedData, dir=null, subDir=null) {
        return dir
            ? {
                ...savedData,
                [dir]: subDir
                    ? {
                        ...savedData[dir],
                        [subDir]: dataToSave,
                    }
                    : dataToSave,
            }
            : {
                ...savedData,
                ...dataToSave,
            };
    },

    _selectDataByDirectory: function _selectDataByDirectory(data, dir=null, subDir=null) {
        return dir
            ? subDir
                ? data[dir][subDir]
                : data[dir]
            : data;
    },

    _setDataToStorage: function _setDataToStorage(data) {
        localStorage.setItem(this._name, JSON.stringify(data));
    },


    get name() {
        return this._name;
    },

    set name(stringName) {
        this._name = stringName.toString();
    },


    load(dir=null, subDir=null) {
        try {
            const
                data = this._getDataFromStorage();

            return this._selectDataByDirectory(data, dir, subDir);

        } catch (error) {
            console.error(error);
        }
    },


    save: function save(dataToSave, dir=null, subDir=null) {
        try {
            const
                savedData = this.load();

            localStorage.setItem(
                this._name,
                JSON.stringify(
                    this._makeDataToSave(dataToSave, savedData, dir, subDir)
                ),
            );

        } catch (error) {
            console.error(error);
        }
    },

};

export default Saver;