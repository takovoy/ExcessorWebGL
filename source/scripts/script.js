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
        0.5, 0.9, 1,
        0.9, 0.1, 1,
        0.1, 0.1, 1
    ];
    var colorBufferMap = [
        1, 0, 0,
        0, 1, 0,
        0, 0, 1
    ];

    var vertexBuffer = drawing.attachBuffer(vertexBufferMap, 'vertexBuffer', {itemSize: 3}).operationContext;
    var colorBuffer = drawing.attachBuffer(colorBufferMap, 'colorBuffer', {itemSize: 3}).operationContext;

    drawing.attachVertexAttributeVariable(program, 'aVertexPosition', vertexBuffer, vertexBuffer.itemSize);
    drawing.attachVertexAttributeVariable(program, 'aVertexColor', colorBuffer, colorBuffer.itemSize);

    drawing.loadTexture('source/images/someTexture.jpg','someTexture',program, function () {
        drawing.render(vertexBufferMap.length / vertexBuffer.itemSize);
    });


    document.body.appendChild(drawing.canvas);
});