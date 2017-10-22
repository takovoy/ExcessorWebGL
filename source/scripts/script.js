var drawing = new ExcessorWebGL.Drawing({
    width: 500,
    height: 500,
    id: 'Hello, world!'
});

window.addEventListener('load', function () {
    if(drawing.initStatus === 'Error'){
        alert('Ваш браузер не поддерживает WebGL. \nИнформация доступна в консоли.');
        return;
    }

    var shaders = [
        drawing.getShader(drawing.context.VERTEX_SHADER,'vertexShader').operationContext,
        drawing.getShader(drawing.context.FRAGMENT_SHADER,'fragmentShader').operationContext
    ];
    var program = drawing.InitShaderProgram(shaders).operationContext;

    var vertexBufferMap = [
        -1, -1, 1,
        1, -1, 1,
        1, 1, 1,
        -1, 1, 1
    ];
    var vertexBuffer = drawing.buffer(vertexBufferMap, 'vertexBuffer', {itemSize: 3}).operationContext;
    drawing.attributeVariable(program, 'aVertexPosition', vertexBuffer, vertexBuffer.itemSize);

    var textureBufferMap = [
        0, 0,
        1, 0,
        1, 1,
        0, 1
    ];
    var textureBuffer = drawing.buffer(textureBufferMap, 'textureBuffer', {itemSize: 2}).operationContext;
    drawing.attributeVariable(program, 'aTexturePosition', textureBuffer, textureBuffer.itemSize);

    var indexBufferMap = [
        0, 1, 2,
        0, 2, 3
    ];
    var indexBuffer = drawing.buffer(indexBufferMap, 'indexBuffer', null, 'ELEMENT_ARRAY_BUFFER', Uint16Array).operationContext;

    drawing.loadTexture('source/images/someTexture.png','someTexture',program, function () {
        drawing.render(6);
    });


    document.body.appendChild(drawing.canvas);
});