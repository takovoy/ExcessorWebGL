var ExcessorWebGL = {};
(function () {
    ExcessorWebGL.Drawing = function (options) {
        options = options || {};
        this.canvas = document.createElement('canvas');
        this.canvas.width = options.width || 300;
        this.canvas.height = options.height || 150;
        this.canvas.id = options.id || Math.random();
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

        var initColor = options.initColor || [0.5,0.5,0.5,1.0];
        this.context.viewportWidth = this.canvas.width;
        this.context.viewportHeight = this.canvas.height;
        this.context.clearColor(initColor[0],initColor[1],initColor[2],initColor[3]);
        this.context.clear(this.context.COLOR_BUFFER_BIT);
        this.buffers = {};
        this.programStack = {};
    };

    var Drawing = ExcessorWebGL.Drawing;

    Drawing.prototype.getShader = function (type, DOMObjectId) {
        if(!this.checkEmptyData([type, DOMObjectId], 'getShader')){return}

        var source = document.getElementById(DOMObjectId).innerHTML;
        var shader = this.context.createShader(type);
        this.context.shaderSource(shader, source);
        this.context.compileShader(shader);

        if (!this.context.getShaderParameter(shader, this.context.COMPILE_STATUS)) {
            this.logError("Shader compilation error: " + this.context.getShaderInfoLog(shader));
            this.context.deleteShader(shader);
            return
        }
        this.operationContext = shader;
        return this;
    };

    Drawing.prototype.attachBuffer = function (bufferMap, id, options, bufferType, dataType, drawType) {
        if(this.checkEmptyData([bufferMap], 'attachBuffer') === false){return}

        id          = id || Math.random();
        bufferType  = bufferType || this.context.ARRAY_BUFFER;
        dataType    = dataType || Float32Array;
        drawType    = drawType || this.context.STATIC_DRAW;
        options     = options || {};
        var buffer  = this.context.createBuffer();

        this.context.bindBuffer(bufferType, buffer);
        this.context.bufferData(bufferType, new dataType(bufferMap), drawType);

        for(var key in options) {
            buffer[key] = options[key];
        }

        buffer.type = bufferType;
        this.buffers[id] = buffer;
        this.operationContext = buffer;
        return this;
    };

    Drawing.prototype.InitShaderProgram = function (shaders, id) {
        id = id || Math.random();
        var program = this.context.createProgram();

        this.attachShaders(program, shaders);

        this.context.linkProgram(program);

        if (!this.context.getProgramParameter(program, this.context.LINK_STATUS)) {
            this.logError('Shader program link error');
            return;
        }

        this.context.useProgram(program);

        program.attributeStack = {};
        program.uniformStack = {};
        this.programStack[id] = program;
        this.operationContext = program;
        return this;
    };

    Drawing.prototype.attachVertexAttributeVariable = function (program, name, buffer, itemSize, dataType) {
        if(this.checkEmptyData([program, name, buffer, itemSize], 'attachVertexAttributeVariable') === false){return}

        dataType = dataType || this.context.FLOAT;
        program.attributeStack[name] = this.context.getAttribLocation(program, name);
        this.context.enableVertexAttribArray(program.attributeStack[name]);
        this.context.bindBuffer(buffer.type, buffer);
        this.context.vertexAttribPointer(program.attributeStack[name], itemSize, dataType, false, 0, 0);
    };

    Drawing.prototype.attachShaders = function (program, shaders) {
        if(this.checkEmptyData([program, shaders], 'attachShaders') === false){return}

        for(var key in shaders){
            this.context.attachShader(program,shaders[key]);
        }

        this.operationContext = program;
        return this;
    };

    Drawing.prototype.render = function (bufferLength, clearColor, viewport, method, offset) {
        if(this.checkEmptyData([bufferLength], 'render') === false){return}

        clearColor = clearColor || [0,0,0,0.2];
        viewport = viewport || {
                x: 0,
                y: 0,
                width: this.context.viewportWidth,
                height: this.context.viewportHeight
            };
        method = method || this.context.TRIANGLES;
        offset = offset || 0;

        this.context.clearColor(clearColor[0], clearColor[1], clearColor[2], clearColor[3]);
        this.context.viewport(viewport.x, viewport.y, viewport.width, viewport.height);
        this.context.clear(this.context.COLOR_BUFFER_BIT);

        this.context.drawArrays(method, offset, bufferLength);
        return this;
    };

    /**
     * @param {string} sourcePath
     * @param {string} name
     * @param {WebGLProgram} program
     * @param {function} callback
     */

    Drawing.prototype.loadTexture = function (sourcePath, name, program, callback) {
        if(!this.checkEmptyData([sourcePath, name, program], 'attachTexture')){return}

        callback = callback || function(){};
        var self = this;
        var sourceImage = new Image();

        sourceImage.onload = function () {
            var texture = self.createTexture(name, program).operationContext;
            self.bindTextureSource(texture, sourceImage, {flip: true});
            callback(texture, sourceImage);
        };

        sourceImage.onerror = function () {
            self.logError('Error of texture loading. \nTexture name: ' + name + ' \nPath of source image: ' + sourcePath);
        };

        sourceImage.src = sourcePath;

        return this;
    };

    Drawing.prototype.createTexture = function (name, program) {
        if(!this.checkEmptyData([name, program], 'createTexture')){return}

        var context = this.context;
        var texture = context.createTexture();

        context.bindTexture(context.TEXTURE_2D, texture);
        program.uniformStack[name] = context.getUniformLocation(program, name);
        context.uniform1i(program.uniformStack[name], 0);

        this.operationContext = texture;
        return this;
    };

    /**
     * @param {WebGLTexture} texture
     * @param {ImageData|HTMLImageElement|HTMLCanvasElement|HTMLVideoElement} sourceImage
     * @param {Object} options
     * @operationContext {WebGLTexture}
     */

    Drawing.prototype.bindTextureSource = function (texture, sourceImage, options) {
        if(!this.checkEmptyData([texture, sourceImage], 'bindTextureSource')){return}

        options = options || {};
        var context = this.context;
        var textureType = options.textureType || context.TEXTURE_2D;
        var colorType = options.colorType || context.RGBA;
        var textureMagFilter = options.textureMagFilter || context.NEAREST;
        var textureMinFilter = options.textureMinFilter || context.NEAREST;
        var flip = !!options.flip;

        context.bindTexture(textureType, texture);
        context.pixelStorei(context.UNPACK_FLIP_Y_WEBGL, flip);
        context.texImage2D(textureType, 0, colorType, colorType, context.UNSIGNED_BYTE, sourceImage);
        context.texParameteri(textureType, context.TEXTURE_MAG_FILTER, textureMagFilter);
        context.texParameteri(textureType, context.TEXTURE_MIN_FILTER, textureMinFilter);

        this.operationContext = texture;
        return this;
    };

    /**
     * @param {Array[]} data
     * @param {string} target
     * @return {boolean}
     */

    Drawing.prototype.checkEmptyData = function (data,target) {
        for(var i = 0;i < data.length;i++){
            if(!data[i]){
                this.logError('Incorrect input data in target - ' + target);
                return false;
            }
        }
        return true;
    };

    /**
     * @param {string|number|Error} error
     */

    Drawing.prototype.logError = function (error) {
        console.error('WebGL Error: \n',error);
        return this;
    };
})();