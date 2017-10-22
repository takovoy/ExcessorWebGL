(function () {
    ExcessorWebGL.dynamic = function (options) {
        options = options || {};
        this.canvas = document.createElement('canvas');
        this.canvas.width = options.width || 300;
        this.canvas.height = options.height || 150;
        this.canvas.id = options.id || Math.random();
        this.clearColor = options.clearColor || [0,0,0,0.2];
        this.viewport = options.viewport || {
                x: 0,
                y: 0,
                width: options.width,
                height: options.height
            };
        try {
            this.context = this.canvas.getContext('webgl') || this.canvas.getContext('experimental-webgl');
        } catch (error) {
            this.logError(error);
        }

        if(!this.context) {
            this.logError('WebGL don`t support in your browser.');
            this.initStatus = 'Error';
            return;
        } else {
            this.initStatus = 'Success';
        }

        var initColor = this.clearColor;
        this.context.clearColor(initColor[0],initColor[1],initColor[2],initColor[3]);
        this.context.clear(this.context.COLOR_BUFFER_BIT);
        this.buffers = {};
        this.programStack = {};
    };

    var dynamic = ExcessorWebGL.dynamic;
})();