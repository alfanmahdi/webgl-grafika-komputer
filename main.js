function main() {
    var canvas = document.getElementById("myCanvas");
    var gl = canvas.getContext("webgl");

    // Check if WebGL is available and initialized
    if (!gl) {
        alert("WebGL is not supported or failed to initialize.");
        return;
    }

    // Create and bind the vertex buffer
    var vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW); // Load vertex data into the buffer

    // Create and bind the normal buffer for lighting calculations
    var normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);

    // Create and bind the color buffer for vertex colors
    var colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

    // Create and bind the index buffer for element array
    var indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW); // Load index data

    // Compile the vertex shader
    var vertexShaderCode = document.getElementById("vertexShaderCode").text;
    var vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, vertexShaderCode);
    gl.compileShader(vertexShader);
    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
        console.error("Vertex shader failed to compile: ", gl.getShaderInfoLog(vertexShader));
        return; // Stop execution if compilation fails
    }

    // Compile the fragment shader
    var fragmentShaderCode = `
        precision mediump float;
        varying vec3 vColor;
        varying vec3 vNormal;
        varying vec3 vPosition;
        uniform vec3 uLightPosition;
        uniform vec3 uLightColor;
        uniform vec3 uAmbientColor;

        void main() {
            vec3 lightDir = normalize(uLightPosition - vPosition); // Calculate direction of light
            float diff = max(dot(vNormal, lightDir), 0.0); // Calculate diffuse component
            vec3 diffuse = diff * uLightColor * vColor; // Diffuse lighting
            vec3 ambient = uAmbientColor * vColor; // Ambient lighting
            gl_FragColor = vec4(ambient + diffuse, 1.0); // Combine ambient and diffuse for final color
        }
    `;
    
    var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, fragmentShaderCode);
    gl.compileShader(fragmentShader);
    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
        console.error("Fragment shader failed to compile: ", gl.getShaderInfoLog(fragmentShader));
        return; // Stop execution if compilation fails
    }

    // Create and link the shader program
    var program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    gl.useProgram(program); // Activate the program

    // Set up attribute pointers for positions, colors, and normals
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    var aPosition = gl.getAttribLocation(program, "aPosition");
    gl.vertexAttribPointer(aPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(aPosition); // Enable vertex position attribute

    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    var aColor = gl.getAttribLocation(program, "aColor");
    gl.vertexAttribPointer(aColor, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(aColor); // Enable color attribute

    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    var aNormal = gl.getAttribLocation(program, "aNormal");
    gl.vertexAttribPointer(aNormal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(aNormal); // Enable normal attribute

    // Set up uniform values for lighting
    var uLightPosition = gl.getUniformLocation(program, 'uLightPosition');
    gl.uniform3fv(uLightPosition, [0.0, -2.0, 2.0]); // Position of the light source

    var uLightColor = gl.getUniformLocation(program, 'uLightColor');
    gl.uniform3fv(uLightColor, [1, 1, 1]); // Light color

    var uAmbientColor = gl.getUniformLocation(program, 'uAmbientColor');
    gl.uniform3fv(uAmbientColor, [0.2, 0.2, 0.2]); // Ambient light color

    // Matrix setup for transformation and projection
    var uFormMatrix = gl.getUniformLocation(program, 'uFormMatrix');
    var formMatrix = glMatrix.mat4.create(); // Identity matrix for transformations

    var uViewMatrix = gl.getUniformLocation(program, 'uViewMatrix');
    var viewMatrix = glMatrix.mat4.create();
    glMatrix.mat4.lookAt(viewMatrix, [0.0, 0.0, 3.0], [0.0, 0.0, 0.0], [0.0, 1.0, 0.0]); // Set camera view

    var uProjectionMatrix = gl.getUniformLocation(program, 'uProjectionMatrix');
    var projectionMatrix = glMatrix.mat4.create();
    glMatrix.mat4.perspective(projectionMatrix, glMatrix.glMatrix.toRadian(60), canvas.width / canvas.height, 0.1, 10.0); // Set perspective projection

    var theta = glMatrix.glMatrix.toRadian(1); // Rotation angle (1 degree per frame)

    function render() {
        if (!freeze) { // Check if rotation should continue
            glMatrix.mat4.rotate(formMatrix, formMatrix, theta, [1.0, 1.0, 1.0]); // Apply rotation
        }

        // Pass matrices to the shader program
        gl.uniformMatrix4fv(uFormMatrix, false, formMatrix);
        gl.uniformMatrix4fv(uViewMatrix, false, viewMatrix);
        gl.uniformMatrix4fv(uProjectionMatrix, false, projectionMatrix);

        // Clear canvas and enable depth testing
        gl.clearColor(1.0, 1.0, 1.0, 1.0); // Set clear color to white
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.enable(gl.DEPTH_TEST);

        // Bind index buffer and draw the elements
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0); // Render the geometry

        requestAnimationFrame(render); // Call the render function again for the next frame
    }

    render(); // Start rendering loop
}
