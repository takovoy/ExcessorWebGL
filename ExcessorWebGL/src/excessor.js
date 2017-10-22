var ExcessorWebGL = {};
ExcessorWebGL.logError = function (error) {
    console.error('WebGL Error: \n', error);
    return this;
};
ExcessorWebGL.checkEmptyData = function (data, target) {
    for (var i = 0; i < data.length; i++) {
        if (!data[i]) {
            this.logError('Incorrect input data in target - ' + target);
            return false;
        }
    }
    return true;
};