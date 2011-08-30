/*
 * ${HEADER}
 */

// provides
goog.provide('X.renderer');

// requires
goog.require('X.base');
goog.require('X.buffer');
goog.require('X.camera');
goog.require('X.colors');
goog.require('X.exception');
goog.require('X.matrixHelper');
goog.require('X.points');
goog.require('goog.dom');
goog.require('goog.iter.Iterator');
goog.require('goog.math.Matrix');
goog.require('goog.math.Vec3');
goog.require('goog.structs.Map');


/**
 * Create a renderer with the given width and height.
 * 
 * @param {number} width The width of the renderer.
 * @param {number} height The height of the renderer.
 * @constructor
 * @extends {X.base}
 */
X.renderer = function(width, height) {

  // call the standard constructor of X.base
  goog.base(this);
  
  //
  // class attributes
  
  /**
   * @inheritDoc
   * @const
   */
  this._className = 'renderer';
  
  /**
   * The dimension of this renderer.
   * 
   * @type {!number}
   * @protected
   */
  this._dimension = -1;
  
  /**
   * The width of this renderer.
   * 
   * @type {!number}
   * @protected
   */
  this._width = width;
  
  /**
   * The height of this renderer.
   * 
   * @type {!number}
   * @protected
   */
  this._height = height;
  
  /**
   * The background color of this renderer.
   * 
   * @type {!string}
   * @protected
   */
  this._backgroundColor = '#000000';
  
  /**
   * The HTML container of this renderer, E.g a name of a <div>.
   * 
   * @type {?Element}
   * @protected
   */
  this._container = null;
  
  /**
   * The Canvas of this renderer.
   * 
   * @type {?Element}
   * @protected
   */
  this._canvas = null;
  
  /**
   * The WebGL context of this renderer.
   * 
   * @type {?Object}
   * @protected
   */
  this._gl = null;
  
  /**
   * The camera of this renderer.
   * 
   * @type {?X.camera}
   * @protected
   */
  this._camera = null;
  
  /**
   * A hash map of displayable objects of this renderer. Each object is stored
   * with a unique id which is used as the key.
   * 
   * @type {!goog.structs.Map}
   * @protected
   */
  this._objects = new goog.structs.Map();
  
  /**
   * A hash map of vertex buffers of this renderer. Each buffer is associated
   * with a displayable object using its unique id.
   * 
   * @type {!goog.structs.Map}
   * @protected
   */
  this._vertexBuffers = new goog.structs.Map();
  
  /**
   * A hash map of color buffers of this renderer. Each buffer is associated
   * with a displayable object using its unique id.
   * 
   * @type {!goog.structs.Map}
   * @protected
   */
  this._colorBuffers = new goog.structs.Map();
  
  /**
   * The id of the last added displayable object -1 if this container is empty.
   * 
   * @type {!number}
   * @protected
   */
  this._id = -1;
  

};
// inherit from X.base
goog.inherits(X.renderer, X.base);


/**
 * Get the dimension of this renderer. E.g. 2 for two-dimensional, 3 for
 * three-dimensional.
 * 
 * @return {!number} The dimension of this renderer.
 */
X.renderer.prototype.getDimension = function() {

  return this._dimension;
  
};


/**
 * Get the width of this renderer.
 * 
 * @return {!number} The width of this renderer.
 */
X.renderer.prototype.getWidth = function() {

  return this._width;
  
};


/**
 * Set the width for this renderer.
 * 
 * @param {!number} width The width for this renderer.
 */
X.renderer.prototype.setWidth = function(width) {

  if (this._canvas) {
    
    // the canvas was already created, let's update it
    this._canvas.style.setProperty('width', width.toString());
    
  }
  
  this._width = width;
  
};


/**
 * Get the height of this renderer.
 * 
 * @return {!number} The height of this renderer.
 */
X.renderer.prototype.getHeight = function() {

  return this._height;
  
};


/**
 * Set the height for this renderer.
 * 
 * @param {!number} height The height for this renderer.
 */
X.renderer.prototype.setHeight = function(height) {

  if (this._canvas) {
    
    // the canvas was already created, let's update it
    this._canvas.style.setProperty('height', height.toString());
    
  }
  
  this._height = height;
  
};


/**
 * Get the background color of this renderer.
 * 
 * @return {!string} The background color of this renderer.
 */
X.renderer.prototype.getBackgroundColor = function() {

  return this._backgroundColor;
  
};


/**
 * Set the background color for this renderer.
 * 
 * @param {!string} backgroundColor The background color for this renderer.
 */
X.renderer.prototype.setBackgroundColor = function(backgroundColor) {

  if (this._canvas) {
    
    // the canvas was already created, let's update it
    this._canvas.style.setProperty('background-color', backgroundColor
        .toString());
    
  }
  
  this._backgroundColor = backgroundColor;
  
};


/**
 * Get the container of this renderer.
 * 
 * @return {!Element} The container of this renderer as a DOM object.
 * @throws {X.exception} An exception if the <body> could not be found.
 */
X.renderer.prototype.getContainer = function() {

  // if no _container is associated, use the document.body
  if (!this._container) {
    
    var _document = goog.dom.getDocument();
    var body = _document.body;
    
    if (!body) {
      
      // throw exception when we can not find the body
      throw new X.exception('Fatal: Could not find <body></body>!');
      
    }
    
    this._container = body;
    
  }
  
  // return the _container
  return this._container;
  
};


/**
 * Set the container (DOM object) for this renderer.
 * 
 * @param {Element} container A container (DOM object).
 * @throws {X.exception} An exception if the container could not be found.
 */
X.renderer.prototype.setContainer = function(container) {

  if (!container) {
    
    // throw exception if the container is invalid
    throw new X.exception('Fatal: Could not find container!');
    
  }
  
  this._container = container;
  
};


/**
 * Set the container for this renderer using an id of a DOM object.
 * 
 * @param {!string} containerId An id of a DOM object.
 */
X.renderer.prototype.setContainerById = function(containerId) {

  // retrieve the DOM object with the given id
  var container = goog.dom.getElement(containerId);
  
  // try to set it as a container
  this.setContainer(container);
  
};


/**
 * Create the canvas of this renderer inside the configured container and using
 * attributes like width, height, backgroundColor etc. Then, initialize the
 * WebGL context and attach all necessary objects (e.g. camera, shaders..). All
 * this will only happen once, no matter how often this method is called.
 * 
 * @throws {X.exception} An exception if there were problems during
 *           initialization.
 */
X.renderer.prototype.init = function() {

  // if the canvas already exists, exit now
  if (this._canvas) {
    return;
  }
  
  // create a canvas object with certain properties
  var canvas = goog.dom.createDom('canvas');
  canvas.style.setProperty('background-color', this.getBackgroundColor()
      .toString());
  canvas.width = this.getWidth();
  canvas.height = this.getHeight();
  
  // append it to the container
  goog.dom.appendChild(this.getContainer(), canvas);
  
  // --------------------------------------------------------------------------
  //
  // WebGL Viewport initialization
  //
  
  //
  // Step1: Get Context of canvas
  //
  try {
    
    var gl = canvas.getContext('experimental-webgl');
    // TODO contexts have different names in different browsers
    
  } catch (e) {
    
    throw new X.exception('Fatal: Exception while getting GL Context!\n' + e);
    
  }
  
  //
  // Step2: Check if we got the context, if not, WebGL is not supported
  //
  if (!gl) {
    
    throw new X.exception('Fatal: WebGL not supported!');
    
  }
  
  //
  // Step3: Configure the context
  //
  try {
    
    gl.viewport(0, 0, this.getWidth(), this.getHeight());
    
    // configure opacity to 0.0 to overwrite the viewport background-color by
    // the canvas color
    gl.clearColor(0.0, 0.0, 0.0, 0.0);
    
    // enable depth testing
    gl.enable(gl.DEPTH_TEST);
    
    // perspective rendering
    gl.depthFunc(gl.LEQUAL);
    
    // clear color and depth buffer
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
  } catch (e) {
    
    throw new X.exception('Fatal: Exception while accessing GL Context!\n' + e);
    
  }
  
  //
  // WebGL Viewport initialization done
  // --------------------------------------------------------------------------
  

  //
  // create a new camera
  var camera = new X.camera(this);
  
  // add shaders to this renderer
  

  //
  // attach all created objects as class attributes
  // should be the last thing to do here since we use these attributes to check
  // if the initialization was completed successfully
  this._canvas = canvas;
  this._gl = gl;
  this._camera = camera;
  
};

// should happen after init directly
X.renderer.prototype.addShaders = function(fragmentShader, vertexShader) {

  if (!this._canvas || !this._gl) {
    
    throw new X.exception('Fatal: Renderer was not initialized properly!');
    
  }
  
  if (!fragmentShader || !vertexShader) {
    
    throw new X.exception('Fatal: Could not add shaders!');
    
  }
  
  // compile the fragment and vertex shaders
  var glFragmentShader = this._gl.createShader(this._gl.FRAGMENT_SHADER);
  var glVertexShader = this._gl.createShader(this._gl.VERTEX_SHADER);
  
  this._gl.shaderSource(glFragmentShader, fragmentShader.getSource());
  this._gl.shaderSource(glVertexShader, vertexShader.getSource());
  
  this._gl.compileShader(glFragmentShader);
  this._gl.compileShader(glVertexShader);
  
  if (!this._gl.getShaderParameter(glFragmentShader, this._gl.COMPILE_STATUS)
      || !this._gl.getShaderParameter(glVertexShader, this._gl.COMPILE_STATUS)) {
    
    throw new X.exception('Fatal: Shader compilation failed!');
    
  }
  
  // initialize the shaders
  var shaderProgram = this._gl.createProgram();
  this._gl.attachShader(shaderProgram, glVertexShader);
  this._gl.attachShader(shaderProgram, glFragmentShader);
  this._gl.linkProgram(shaderProgram);
  
  if (!this._gl.getProgramParameter(shaderProgram, this._gl.LINK_STATUS)) {
    
    throw new X.exception('Fatal: Could not create shader program!');
    
  }
  
  this._gl.useProgram(shaderProgram);
  
  // TODO Shader
  this._vertexPositionAttribute = this._gl.getAttribLocation(shaderProgram,
      "vertexPosition");
  this._gl.enableVertexAttribArray(this._vertexPositionAttribute);
  
  // TODO Shader
  this._vertexColorAttribute = this._gl.getAttribLocation(shaderProgram,
      "vertexColor");
  this._gl.enableVertexAttribArray(this._vertexColorAttribute);
  

  this._shaderProgram = shaderProgram;
  
};

X.renderer.prototype.addObject = function(object) {

  if (!this._canvas || !this._gl || !this._camera) {
    
    throw new X.exception('Fatal: Renderer was not initialized properly!');
    
  }
  
  if (!object || !(object instanceof X.object)) {
    
    throw new X.exception('Fatal: Illegal object!');
    
  }
  
  // first, we check if the object is properly defined
  //
  // case 1:
  // object has an object color defined
  // we create point colors matching this object color
  // case 2:
  // object has not an object color defined and does have the same number of
  // points and point-colors defined
  // case 3:
  // object has not an object color defined and also not the same number of
  // points and point-colors, then we set the object color to 1
  //
  // in all cases, we do not want to correct the passed in object but just
  // correct to good value internally
  
  var colorsValid = false;
  var objectColor = new X.color(1, 1, 1); // initialize to default color (white)
  var colors = null;
  
  // if no object color was set up, check for valid point colors
  if (goog.isNull(object.color())) {
    
    // no object color, check if valid point-colors are defined
    colorsValid = (object.points().count() == object.colors().count());
    colors = object.colors();
    
  } else {
    
    // valid object color
    objectColor = object.color();
    
  }
  
  // if we don't have valid colors at this point, create some based on the
  // objectColor
  if (!colorsValid) {
    
    colors = new X.colors();
    
    var i;
    for (i = 0; i < object.points().count(); i++) {
      
      colors.add(objectColor);
      
    }
    
  }
  
  // create vertex buffer
  var glVertexBuffer = this._gl.createBuffer();
  
  // bind and fill with vertices of current object
  this._gl.bindBuffer(this._gl.ARRAY_BUFFER, glVertexBuffer);
  this._gl.bufferData(this._gl.ARRAY_BUFFER, new Float32Array(object.points()
      .flatten()), this._gl.STATIC_DRAW);
  
  // create an X.buffer to store the vertices
  // every vertex consists of 3 items (x,y,z)
  var vertexBuffer = new X.buffer(glVertexBuffer, object.points().count(), 3);
  
  // create color buffer
  var glColorBuffer = this._gl.createBuffer();
  
  // bind and fill with colors defined above
  this._gl.bindBuffer(this._gl.ARRAY_BUFFER, glColorBuffer);
  this._gl.bufferData(this._gl.ARRAY_BUFFER,
      new Float32Array(colors.flatten()), this._gl.STATIC_DRAW);
  
  // create an X.buffer to store the colors
  // every color consists of 4 items (r,g,b,alpha)
  var colorBuffer = new X.buffer(glColorBuffer, colors.count(), 4);
  
  // TODO buffers for lightning etc..
  
  if (this._objects.containsKey(++this._id)) {
    
    throw new X.exception('Fatal: Could not get unique id.');
    
  }
  
  var uniqueId = this._id;
  
  // now store the object and the buffers in the hash maps
  this._objects.set(uniqueId, object);
  this._vertexBuffers.set(uniqueId, vertexBuffer);
  this._colorBuffers.set(uniqueId, colorBuffer);
  
  return uniqueId;
  
};

X.renderer.prototype.render = function() {

  if (!this._canvas || !this._gl || !this._camera) {
    
    throw new X.exception('Fatal: The renderer was not initialized properly!');
    
  }
  
  // clear the canvas
  this._gl.clear(this._gl.COLOR_BUFFER_BIT | this._gl.DEPTH_BUFFER_BIT);
  
  // grab the current perspective from the camera
  var perspectiveMatrix = this._camera.getPerspective();
  
  // grab the current view from the camera
  var viewMatrix = this._camera.getView();
  
  // TODO shader
  var perspectiveUniformLocation = this._gl.getUniformLocation(
      this._shaderProgram, "perspective");
  
  this._gl.uniformMatrix4fv(perspectiveUniformLocation, false,
      new Float32Array(perspectiveMatrix.flatten()));
  
  var viewUniform = this._gl.getUniformLocation(this._shaderProgram, "view");
  
  this._gl.uniformMatrix4fv(viewUniform, false, new Float32Array(viewMatrix
      .flatten()));
  
  // loop through all objects and (re-)draw them
  var keyIterator = this._objects.getKeyIterator();
  
  try {
    
    while (true) {
      
      var key = keyIterator.next();
      
      var object = this._objects.get(key);
      
      if (object) {
        
        // we have a valid object
        var vertexBuffer = this._vertexBuffers.get(key);
        var colorBuffer = this._colorBuffers.get(key);
        
        // ..bind the glBuffers
        this._gl.bindBuffer(this._gl.ARRAY_BUFFER, vertexBuffer.glBuffer());
        
        this._gl.vertexAttribPointer(this._vertexPositionAttribute,
            vertexBuffer.itemSize(), this._gl.FLOAT, false, 0, 0);
        
        this._gl.bindBuffer(this._gl.ARRAY_BUFFER, colorBuffer.glBuffer());
        
        this._gl.vertexAttribPointer(this._vertexColorAttribute, colorBuffer
            .itemSize(), this._gl.FLOAT, false, 0, 0);
        
        // .. and draw
        this._gl.drawArrays(this._gl.TRIANGLE_STRIP, 0, vertexBuffer
            .itemCount());
        
      }
      
    } // while
    
  } catch (e) {
    
    if (e != goog.iter.StopIteration) {
      
      // there was an error
      throw e;
      
    }
    
  }
  
};

/**
 * @param vector
 * @returns {goog.math.Vec2}
 */
X.renderer.prototype.convertWorldToDisplayCoordinates = function(vector) {

  var view = this._camera.getView();
  var perspective = this._camera.getPerspective();
  
  var viewPerspective = goog.math.Matrix.createIdentityMatrix(4);
  viewPerspective.multiply(view);
  viewPerspective.multiply(perspective);
  
  var twoDVectorAsMatrix;
  twoDVectorAsMatrix = viewPerspective.multiplyByVector(vector);
  
  var x = (twoDVectorAsMatrix.getValueAt(0, 0) + 1) / 2.0;
  x = x * this.getWidth();
  
  var y = (1 - twoDVectorAsMatrix.getValueAt(0, 1)) / 2.0;
  y = y * this.getHeight();
  
  return new goog.math.Vec2(Math.round(x), Math.round(y));
  
};
