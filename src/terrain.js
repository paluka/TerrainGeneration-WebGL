var gl;

function Vertex(x, y, z){
    this.x = x;
    this.y = y;
    this.z = z;
    this.nX = 0;
    this.nY = 0;
    this.nZ = 0;
}


var vertex;

var midSteps;// = 3;
var startX = 0;
var startY = 0;
var stepX;// = 22;
var stepY;// = 22;
var numX = 6;
var numY = 6;


//Finds the normal vector between 3 vertices
function findNormal(p1, p2, p3){

    //Find the first vector using p1 and p2
    var vector1 = [(p2.x - p1.x),(p2.y - p1.y),(p2.z - p1.z)];
    //Find the second vector using p1 and p3
    var vector2 = [(p3.x - p1.x),(p3.y - p1.y),(p3.z - p1.z)];
    //Now calculate the normal by taking the cross product of the two vectors
    var xComp = (vector1.y*vector2.z) - (vector1.z*vector2.y);
    var yComp = (vector1.z*vector2.x) - (vector1.x*vector2.z);
    var zComp = (vector1.x*vector2.y) - (vector1.y*vector2.x);
    var normal = [xComp, yComp, zComp];

    return normal;
}

function initGL(canvas) {
    try {
        gl = canvas.getContext("experimental-webgl");
        gl.viewportWidth = canvas.width;
        gl.viewportHeight = canvas.height;
    } catch (e) {
    }
    if (!gl) {
        alert("Could not initialise WebGL, sorry :-(");
    }
}


function getShader(gl, id) {
    var shaderScript = document.getElementById(id);
    if (!shaderScript) {
        return null;
    }

    var str = "";
    var k = shaderScript.firstChild;
    while (k) {
        if (k.nodeType == 3) {
            str += k.textContent;
        }
        k = k.nextSibling;
    }

    var shader;

    if (shaderScript.type == "x-shader/x-fragment") {
        shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else if (shaderScript.type == "x-shader/x-vertex") {
        shader = gl.createShader(gl.VERTEX_SHADER);
    } else {
        return null;
    }

    gl.shaderSource(shader, str);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert(gl.getShaderInfoLog(shader));
        return null;
    }

    return shader;
}


var shaderProgram;

function initShaders() {
    var fragmentShader = getShader(gl, "shader-fs");
    var vertexShader = getShader(gl, "shader-vs");

    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert("Could not initialise shaders");
    }

    gl.useProgram(shaderProgram);

    shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
    gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

    shaderProgram.vertexNormalAttribute = gl.getAttribLocation(shaderProgram, "aVertexNormal");
    gl.enableVertexAttribArray(shaderProgram.vertexNormalAttribute);




    shaderProgram.vertexColorAttribute = gl.getAttribLocation(shaderProgram, "aVertexColor");
    gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute);

    shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
    shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
    shaderProgram.nMatrixUniform = gl.getUniformLocation(shaderProgram, "uNMatrix");

    shaderProgram.ambientColorUniform = gl.getUniformLocation(shaderProgram, "uAmbientColor");
}


var mvMatrix = mat4.create();
var mvMatrixStack = [];
var pMatrix = mat4.create();

function mvPushMatrix() {
    var copy = mat4.create();
    mat4.set(mvMatrix, copy);
    mvMatrixStack.push(copy);
}

function mvPopMatrix() {
    if (mvMatrixStack.length == 0) {
        throw "Invalid popMatrix!";
    }
    mvMatrix = mvMatrixStack.pop();
}


function setMatrixUniforms() {


    gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
    gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);

    var normalMatrix = mat3.create();
    mat4.toInverseMat3(mvMatrix, normalMatrix);
    mat3.transpose(normalMatrix);
    gl.uniformMatrix3fv(shaderProgram.nMatrixUniform, false, normalMatrix);

}


function degToRad(degrees) {
    return degrees * Math.PI / 180;
}


var terrainBuffer;
var colorBuffer;
var normalBuffer;
var vertexIndexBuffer

var lastTime = 0;


function animate() {
    var timeNow = new Date().getTime();
    if (lastTime != 0) {
        var elapsed = timeNow - lastTime;


    }
    lastTime = timeNow;
}


function tick() {
    requestAnimFrame(tick);
    drawScene3();
    animate();
}

var xx = -50;
var yy = 0;
var zz = -57;
var rotX = -1.1;
var rotY = 0;
var rotZ = -0.1;

function drawScene3(){
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    //gl.clearColor(1.0, 1.0, 1.0, 1.0);

    mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 1000.0, pMatrix);

    mat4.identity(mvMatrix);
    //mat4.translate(mvMatrix, [-1.5, 0.0, -18.0]);
    mat4.translate(mvMatrix, [xx - numX/4, yy-numY/4, zz]);
    mat4.rotate(mvMatrix, rotX, [1, 0, 0]);
    mat4.rotate(mvMatrix, rotY, [0, 1, 0]);
    mat4.rotate(mvMatrix, rotZ, [0, 0, 1]);
    
    mvPushMatrix();

    gl.bindBuffer(gl.ARRAY_BUFFER, terrainBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, terrainBuffer.itemSize, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, normalBuffer.itemSize, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, colorBuffer.itemSize, gl.FLOAT, false, 0, 0);


    gl.uniform3f(
        shaderProgram.ambientColorUniform,
        parseFloat(document.getElementById("ambientR").value),
        parseFloat(document.getElementById("ambientG").value),
        parseFloat(document.getElementById("ambientB").value)
    );

    setMatrixUniforms();
    gl.drawArrays(gl.TRIANGLES, 0, terrainBuffer.numItems);
    mvPopMatrix();
}

var poop = [[9, 7, 2, -13, -4, -13],
        [3, 15, 9, 3, -2, 0],
        [13, 4, 0, -3, -5, -4],
        [3, -3, -6, 1, 0, 5],
        [7, 14, 18, 9, 4, 3],
        [0, 5, 9, 10, 5, 12]];

function initVertices(){
midSteps = parseInt(document.getElementById("midSteps").value);
stepX = parseInt(document.getElementById("stepX").value);
stepY = parseInt(document.getElementById("stepY").value);

//poop = new Array();

poop[0][0] = parseInt(document.getElementById("t1").value);
poop[0][1] = parseInt(document.getElementById("t2").value);
poop[0][2] = parseInt(document.getElementById("t3").value);
poop[0][3] = parseInt(document.getElementById("t4").value);
poop[0][4] = parseInt(document.getElementById("t5").value);
poop[0][5] = parseInt(document.getElementById("t6").value); 

poop[1][0] = parseInt(document.getElementById("t7").value);
poop[1][1] = parseInt(document.getElementById("t8").value);
poop[1][2] = parseInt(document.getElementById("t9").value);
poop[1][3] = parseInt(document.getElementById("t10").value);
poop[1][4] = parseInt(document.getElementById("t11").value);
poop[1][5] = parseInt(document.getElementById("t12").value); 

poop[2][0] = parseInt(document.getElementById("t13").value);
poop[2][1] = parseInt(document.getElementById("t14").value);
poop[2][2] = parseInt(document.getElementById("t15").value);
poop[2][3] = parseInt(document.getElementById("t16").value);
poop[2][4] = parseInt(document.getElementById("t17").value);
poop[2][5] = parseInt(document.getElementById("t18").value); 

poop[3][0] = parseInt(document.getElementById("t19").value);
poop[3][1] = parseInt(document.getElementById("t20").value);
poop[3][2] = parseInt(document.getElementById("t21").value);
poop[3][3] = parseInt(document.getElementById("t22").value);
poop[3][4] = parseInt(document.getElementById("t23").value);
poop[3][5] = parseInt(document.getElementById("t24").value);

poop[4][0] = parseInt(document.getElementById("t25").value);
poop[4][1] = parseInt(document.getElementById("t26").value);
poop[4][2] = parseInt(document.getElementById("t27").value);
poop[4][3] = parseInt(document.getElementById("t28").value);
poop[4][4] = parseInt(document.getElementById("t29").value);
poop[4][5] = parseInt(document.getElementById("t30").value);  

poop[5][0] = parseInt(document.getElementById("t31").value);
poop[5][1] = parseInt(document.getElementById("t32").value);
poop[5][2] = parseInt(document.getElementById("t33").value);
poop[5][3] = parseInt(document.getElementById("t34").value);
poop[5][4] = parseInt(document.getElementById("t35").value);
poop[5][5] = parseInt(document.getElementById("t36").value); 

     

    var i = 0;
    var j = 0;
    vertex = new Array();

    for(i = 0; i < numY; i++){
        for(j = 0; j < numX; j++){
            var v = new Vertex(
                startX + (j*stepX),
                startY + (i*stepY),
                poop[i][j]);
            vertex.push(v);
        }
    }

    var k = 0;
    var vNew = new Array();
    for(k = 0; k < midSteps; k++){
        var i;
        var j;
        for(i = 0; i < (numY-1); i++){
            for(j = 0; j < numX-1; j++){
                var v= new Vertex((vertex[(i*numX + j)].x + vertex[(i*numX + j + 1)].x)/2,
                    (vertex[(i*numX + j)].y + vertex[(i*numX + j + 1)].y)/2,
                    (vertex[(i*numX + j)].z + vertex[(i*numX + j + 1)].z)/2 + Math.random()*2 - 1);
                vNew.push(vertex[(i*numX + j)]);
                vNew.push(v);
            }
            vNew.push(vertex[(i*numX + j)]);

            for(j = 0; j < numX-1; j++){
                var v = new Vertex((vertex[(i*numX + j)].x + vertex[(i*numX + j)].x)/2,
                    (vertex[(i*numX + j)].y + vertex[((i+1)*numX + j)].y)/2,
                    (vertex[(i*numX + j)].z + vertex[((i+1)*numX + j)].z)/2 + Math.random()*2 - 1);
                vNew.push(v);
                v = new Vertex((vertex[(i*numX + j)].x + vertex[(i*numX + j + 1)].x)/2,
                    (vertex[(i*numX + j)].y + vertex[((i+1)*numX + j + 1)].y)/2,
                    (vertex[(i*numX + j)].z + vertex[((i+1)*numX + j + 1)].z)/2 + Math.random()*2 - 1);
                vNew.push(v);
            }
            var v = new Vertex((vertex[(i*numX + j)].x + vertex[(i*numX + j)].x)/2,
                (vertex[(i*numX + j)].y + vertex[((i+1)*numX + j)].y)/2,
                (vertex[(i*numX + j)].z + vertex[((i+1)*numX + j)].z)/2 + Math.random()*2 - 1);
            vNew.push(v);
        }

        for(j = 0; j < numX-1; j++){
            var v = new Vertex((vertex[(i*numX + j)].x + vertex[(i*numX + j + 1)].x)/2,
                (vertex[(i*numX + j)].y + vertex[(i*numX + j + 1)].y)/2,
                (vertex[(i*numX + j)].z + vertex[(i*numX + j + 1)].z)/2 + Math.random()*2 - 1);
            vNew.push(vertex[(i*numX + j)]);
            vNew.push(v);
        }
        vNew.push(vertex[(i*numX + j)]);
        vertex = vNew;
        vNew = new Array();
        numX += numX -1;
        numY += numY -1;
    }

    // Find the normals of the vertices
    var i = 0;
    var j = 0;
    for(i = 0; i < (numY-1); i++){
        for(j = 0; j < (numX-1); j++){
            if (i == 0 && j == 0){
                var normal = findNormal(vertex[(i*numX + j)], vertex[((i+1)*numX + j)], vertex[(i*numX + (j+1))]);
                vertex[(i*numX + j)].nX = normal.x;
                vertex[(i*numX + j)].nY = normal.y;
                vertex[(i*numX + j)].nZ = normal.z;
            } else if (i == 0){
                var normal1 = findNormal(vertex[(i*numX + j-1)], vertex[((i+1)*numX + j-1)], vertex[(i*numX + j)]);
                var normal2 = findNormal(vertex[((i+1)*numX + j-1)], vertex[((i+1)*numX + j)], vertex[(i*numX + j)]);
                var normal3 = findNormal(vertex[(i*numX + j)], vertex[((i+1)*numX + j)], vertex[(i*numX + j+1)]);

                vertex[(i*numX + j)].nX = (normal1.x + normal2.x + normal3.x)/3;
                vertex[(i*numX + j)].nY = (normal1.y + normal2.y + normal3.y)/3;
                vertex[(i*numX + j)].nZ = (normal1.z + normal2.z + normal3.z)/3;
            } else if (j == 0){
                var normal1 = findNormal(vertex[((i-1)*numX + j)], vertex[(i*numX + j)], vertex[((i-1)*numX + j+1)]);
                var normal2 = findNormal(vertex[((i-1)*numX + j+1)], vertex[(i*numX + j)], vertex[(i*numX + j+1)]);
                var normal3 = findNormal(vertex[(i*numX + j)], vertex[((i+1)*numX + j)], vertex[(i*numX + j+1)]);

                vertex[(i*numX + j)].nX = (normal1.x + normal2.x + normal3.x)/3;
                vertex[(i*numX + j)].nY = (normal1.y + normal2.y + normal3.y)/3;
                vertex[(i*numX + j)].nZ = (normal1.z + normal2.z + normal3.z)/3;
            } else {
                var normal1 = findNormal(vertex[((i-1)*numX + j)], vertex[(i*numX + j-1)], vertex[(i*numX + j)]);
                var normal2 = findNormal(vertex[((i+1)*numX + j-1)], vertex[(i*numX + j-1)], vertex[(i*numX + j)]);
                var normal3 = findNormal(vertex[((i+1)*numX + j-1)], vertex[((i+1)*numX + j)], vertex[(i*numX + j)]);
                var normal4 = findNormal(vertex[(i*numX + j+1)], vertex[((i+1)*numX + j)], vertex[(i*numX + j)]);
                var normal5 = findNormal(vertex[((i-1)*numX + j+1)], vertex[(i*numX + j+1)], vertex[(i*numX + j)]);
                var normal6 = findNormal(vertex[((i-1)*numX + j)], vertex[((i-1)*numX + j+1)], vertex[(i*numX + j+1)]);

                vertex[(i*numX + j)].nX = (normal1.x + normal2.x + normal3.x + normal4.x + normal5.x + normal6.x)/6;
                vertex[(i*numX + j)].nY = (normal1.y + normal2.y + normal3.y + normal4.y + normal5.y + normal6.y)/6;
                vertex[(i*numX + j)].nZ = (normal1.z + normal2.z + normal3.z + normal4.z + normal5.z + normal6.z)/6;
            }
        }
    }
}

function initBuffers(){
    var i = 0;
    var j = 0;

    terrainBuffer = gl.createBuffer();

    gl.bindBuffer(gl.ARRAY_BUFFER, terrainBuffer);
    var vertices = new Array();
    var ns = new Array();
    var indexBuffer = new Array();

    for(i = 0; i < (numY-1); i++){
        for(j = 0; j < (numX-1); j++){

            var index = (i*numX + j);
            indexBuffer.push(index);
            //glNormal3f(vertex.at(index).nX, vertex.at(index).nY, vertex.at(index).nZ);
            vertices.push(vertex[(index)].x);
            vertices.push(vertex[(index)].y);
            vertices.push(vertex[(index)].z);

            ns.push(vertex[(index)].nX);
            ns.push(vertex[(index)].nY);
            ns.push(vertex[(index)].nZ);

            index = ((i+1)*numX + j);
            indexBuffer.push(index);
            //glNormal3f(vertex.at(index).nX, vertex.at(index).nY, vertex.at(index).nZ);
            vertices.push(vertex[(index)].x);
            vertices.push(vertex[(index)].y);
            vertices.push(vertex[(index)].z);

            ns.push(vertex[(index)].nX);
            ns.push(vertex[(index)].nY);
            ns.push(vertex[(index)].nZ);

            index = (i*numX + (j+1));
            indexBuffer.push(index);
            //glNormal3f(vertex.at(index).nX, vertex.at(index).nY, vertex.at(index).nZ);
            vertices.push(vertex[(index)].x);
            vertices.push(vertex[(index)].y);
            vertices.push(vertex[(index)].z);

            ns.push(vertex[(index)].nX);
            ns.push(vertex[(index)].nY);
            ns.push(vertex[(index)].nZ);

            index = (i*numX + (j+1));
            indexBuffer.push(index);
            //glNormal3f(vertex.at(index).nX, vertex.at(index).nY, vertex.at(index).nZ);
            vertices.push(vertex[(index)].x);
            vertices.push(vertex[(index)].y);
            vertices.push(vertex[(index)].z);

            ns.push(vertex[(index)].nX);
            ns.push(vertex[(index)].nY);
            ns.push(vertex[(index)].nZ);

            index = ((i+1)*numX + (j+1));
            indexBuffer.push(index);
            //glNormal3f(vertex.at(index).nX, vertex.at(index).nY, vertex.at(index).nZ);
            vertices.push(vertex[(index)].x);
            vertices.push(vertex[(index)].y);
            vertices.push(vertex[(index)].z);

            ns.push(vertex[(index)].nX);
            ns.push(vertex[(index)].nY);
            ns.push(vertex[(index)].nZ);

            index = ((i+1)*numX + j);
            indexBuffer.push(index);
            //glNormal3f(vertex.at(index).nX, vertex.at(index).nY, vertex.at(index).nZ);
            vertices.push(vertex[(index)].x);
            vertices.push(vertex[(index)].y);
            vertices.push(vertex[(index)].z);

            ns.push(vertex[(index)].nX);
            ns.push(vertex[(index)].nY);
            ns.push(vertex[(index)].nZ);

        }
    }

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    terrainBuffer.itemSize = 3;
    terrainBuffer.numItems = vertices.length/3;


    colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER,colorBuffer);
    var colors = new Array();

    var d = 0;
    for(d = 0; d < 4*vertices.length; d++){
        colors.push(0);
        colors.push(1);
        colors.push(0);
    }
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
    colorBuffer.itemSize = 4;
    colorBuffer.numItems = vertices.length/3;

    normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(ns), gl.STATIC_DRAW);
    normalBuffer.itemSize = 3;
    normalBuffer.numItems = ns.length/3;

    vertexIndexBuffer = gl.createBuffer();
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indexBuffer), gl.STATIC_DRAW);
    vertexIndexBuffer.itemSize = 3;
    vertexIndexBuffer.numItems = indexBuffer.length/3;

}
var currentlyPressedKeys = {};

function handleKeyDown(event) {
    currentlyPressedKeys[event.keyCode] = true;

    if (String.fromCharCode(event.keyCode) == "X") {
        xx += 1;
    } else if (String.fromCharCode(event.keyCode) == "Y") {
        yy += 1;
    } else if (String.fromCharCode(event.keyCode) == "Z") {
        zz += 1;
    } else if (String.fromCharCode(event.keyCode) == "S") {
        xx -= 1;
    } else if (String.fromCharCode(event.keyCode) == "T") {
        yy -= 1;
    } else if (String.fromCharCode(event.keyCode) == "A") {
        zz -= 1;
    } else if (String.fromCharCode(event.keyCode) == "R") {
        rotX += 0.1;
    } else if (String.fromCharCode(event.keyCode) == "E") {
        rotX -= 0.1;
    } else if (String.fromCharCode(event.keyCode) == "F") {
        rotY += 0.1;
    } else if (String.fromCharCode(event.keyCode) == "D") {
        rotY -= 0.1;
    } else if (String.fromCharCode(event.keyCode) == "V") {
        rotZ += 0.1;
    } else if (String.fromCharCode(event.keyCode) == "C") {
        rotZ -= 0.1;
    }
    
}
function webGLStart() {
    //if (navigator.appName != 'Microsoft Internet Explorer'){
    //	document.getElementById("wgl").style.display = "block";
    var canvas = document.getElementById("canvas1");

    //if (canvas.getContext){
    //document.getElementById("wgl").style.display = "block";
    document.onkeydown = handleKeyDown;
    initGL(canvas);
    initShaders()
    initVertices();
    initBuffers();

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);

    tick();
    //}
}