(function () {
    var excessor = ExcessorWebGL;
    excessor.Drawing = function (options) {
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
            excessor.logError(error);
        }

        if(!this.context) {
            excessor.logError('WebGL don`t support in your browser.');
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

    var Drawing = ExcessorWebGL.Drawing;

    Drawing.prototype.getShader = function (type, DOMObjectId) {
        if(!excessor.checkEmptyData([type, DOMObjectId], 'getShader')){return}

        var source = document.getElementById(DOMObjectId).innerHTML;
        var shader = this.context.createShader(type);
        this.context.shaderSource(shader, source);
        this.context.compileShader(shader);

        if (!this.context.getShaderParameter(shader, this.context.COMPILE_STATUS)) {
            excessor.logError("Shader compilation error: " + this.context.getShaderInfoLog(shader));
            this.context.deleteShader(shader);
            return
        }
        this.operationContext = shader;
        return this;
    };

    Drawing.prototype.buffer = function (bufferMap, id, options, bufferType, dataType, drawType) {
        if(!excessor.checkEmptyData([bufferMap], 'buffer')){return}

        id          = id || Math.random();
        bufferType  = bufferType || 'ARRAY_BUFFER';
        bufferType  = this.context[bufferType];
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
        if(!excessor.checkEmptyData([shaders], 'InitShaderProgram')){return}
        id = id || Math.random();
        var program = this.context.createProgram();

        this.attachShaders(program, shaders);

        this.context.linkProgram(program);

        if (!this.context.getProgramParameter(program, this.context.LINK_STATUS)) {
            excessor.logError('Shader program link error');
            return;
        }

        this.context.useProgram(program);

        program.attributeStack = {};
        program.uniformStack = {};
        this.programStack[id] = program;
        this.operationContext = program;
        return this;
    };

    Drawing.prototype.attributeVariable = function (program, name, buffer, itemSize, dataType) {
        if(!excessor.checkEmptyData([program, name, buffer, itemSize], 'attributeVariable')){return}

        dataType = dataType || this.context.FLOAT;
        program.attributeStack[name] = this.context.getAttribLocation(program, name);
        this.context.enableVertexAttribArray(program.attributeStack[name]);
        this.context.bindBuffer(buffer.type, buffer);
        this.context.vertexAttribPointer(program.attributeStack[name], itemSize, dataType, false, 0, 0);
    };

    Drawing.prototype.attachShaders = function (program, shaders) {
        if(!excessor.checkEmptyData([program, shaders], 'attachShaders')){return}

        for(var key in shaders){
            this.context.attachShader(program,shaders[key]);
        }

        this.operationContext = program;
        return this;
    };

    Drawing.prototype.render = function (bufferLength, clearColor, viewport, method, offset) {
        if(!excessor.checkEmptyData([bufferLength], 'render')){return}

        var context = this.context;
        clearColor = clearColor || this.clearColor;
        viewport = viewport || this.viewport;
        method = method || 'TRIANGLES';
        offset = offset || 0;

        context.clearColor(clearColor[0], clearColor[1], clearColor[2], clearColor[3]);
        context.clear(context.COLOR_BUFFER_BIT || context.DEPTH_BUFFER_BIT);
        context.viewport(viewport.x, viewport.y, viewport.width, viewport.height);

        context.drawElements(context[method], bufferLength, context.UNSIGNED_SHORT, offset);
        //context.drawArrays(context[method], offset, bufferLength);
        return this;
    };

    /**
     * @param {string} sourcePath
     * @param {string} name
     * @param {WebGLProgram} program
     * @param {function} callback
     */

    Drawing.prototype.loadTexture = function (sourcePath, name, program, callback) {
        if(!excessor.checkEmptyData([sourcePath, name, program], 'attachTexture')){return}

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
        if(!excessor.checkEmptyData([name, program], 'createTexture')){return}

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
        if(!excessor.checkEmptyData([texture, sourceImage], 'bindTextureSource')){return}

        options = options || {};
        var context = this.context;
        var textureType = options.textureType || context.TEXTURE_2D;
        var colorType = options.colorType || context.RGBA;
        var textureMagFilter = options.textureMagFilter || context.LINEAR;
        var textureMinFilter = options.textureMinFilter || context.LINEAR;
        var flip = !!options.flip;

        context.bindTexture(textureType, texture);
        context.pixelStorei(context.UNPACK_FLIP_Y_WEBGL, flip);
        context.texImage2D(textureType, 0, colorType, colorType, context.UNSIGNED_BYTE, sourceImage);
        context.texParameteri(textureType, context.TEXTURE_MAG_FILTER, textureMagFilter);
        context.texParameteri(textureType, context.TEXTURE_MIN_FILTER, textureMinFilter);

        this.operationContext = texture;
        return this;
    };
})();