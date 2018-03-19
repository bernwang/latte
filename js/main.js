

if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

var renderer, scene, camera, stats;
var pointcloud;
var raycaster;
var mouse = new THREE.Vector2();
var intersection = null;
var clock;
var mouseDown;
var highlightMode = false;
var threshold = 0.1;
var pointSize = 0.5;
// data structures
var data;
var spheres = [];
var pointsWithSpheres = new Set();
var selectedPoints = [];
var boxMap = new Map();
var boundingBoxes = [];
var image_loaded = false;

var newBoundingBox;
var newBox;

var mouse = new THREE.Vector3();
var anchor = new THREE.Vector3();

var boxgeometry = new THREE.BoxGeometry( 1, 1, 1 );
var boxmaterial = new THREE.MeshDepthMaterial( {opacity: .1} );
var move2D = false;

var t = 0, dt = 0.01;                   // t (dt delta for demo)
var start, end;
    // a = {x: -2, y: -1, z: -1},          // start position
    // b = {x: 1.5, y: 0.5, z: 0.7};       // end position
    
init();
// animate();

// Should be in init?
var sphereGeometry, sphereMaterial;


function generatePointCloud( vertices, color ) {

    var geometry = new THREE.Geometry();

    var colors = [];

    var k = 0;

    for ( var i = 0, l = vertices.length; i < l; i ++ ) {
        // creates new vector from a cluster and adds to geometry
        var v = new THREE.Vector3( vertices[ 32 * k + 1 ], 
            vertices[ 32 * k + 2 ], vertices[ 32 * k ] );
        // var v = new THREE.Vector3( vertices[ 32 * k + 1 ], 
        //     0, vertices[ 32 * k ] );
        geometry.vertices.push( v );

        var intensity = ( 1 ) * 7;
        colors[ k ] = ( color.clone().multiplyScalar( intensity ) );

        k++;
    }

    geometry.colors = colors;
    geometry.computeBoundingBox();

    var material = new THREE.PointsMaterial( { size: pointSize, vertexColors: THREE.VertexColors } );
    // creates pointcloud given vectors
    var pointcloud = new THREE.Points( geometry, material );

    return pointcloud;

}

// called first, populates scene and initializes renderer
function init() {

    var container = document.getElementById( 'container' );

    scene = new THREE.Scene();

    clock = new THREE.Clock();

    camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 10000 );
    // camera.position.y = 25;
    // camera.position.z = 37;
    camera.position.set(0, 100, 0);
    camera.lookAt(new THREE.Vector3(0,0,0));


    sphereGeometry = new THREE.SphereGeometry( 0.1, 32, 32 );
    sphereMaterial = new THREE.MeshBasicMaterial( { color: 0xff0000, shading: THREE.FlatShading } );

    //

    var grid = new THREE.GridHelper( 200, 20 );
    grid.setColors( 0xffffff, 0xffffff );
    scene.add( grid );

    //

    renderer = new THREE.WebGLRenderer({preserveDrawingBuffer: true});
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    container.appendChild( renderer.domElement );

    //

    raycaster = new THREE.Raycaster();
    raycaster.params.Points.threshold = threshold;

    //

    stats = new Stats();
    container.appendChild( stats.dom );

    //

    controls = new THREE.OrbitControls( camera, renderer.domElement );
    // controls.enabled = false;
    // controls.maxPolarAngle = 0;
    // controls.minPolarAngle = 0;
    // controls.maxAzimuthAngle = Math.PI;
    // controls.minAzimuthAngle = -Math.PI;
    //

    window.addEventListener( 'resize', onWindowResize, false );
    document.addEventListener( 'mousemove', onDocumentMouseMove, false );
    document.addEventListener( 'mousedown', onDocumentMouseDown, false );
    document.addEventListener( 'mouseup', onDocumentMouseUp, false );
    document.getElementById( 'save' ).addEventListener( 'click', save, false );
    document.getElementById( 'export' ).addEventListener( 'click', save_image, false );
    document.getElementById( 'move' ).addEventListener( 'click', moveMode, false );
    document.getElementById( 'move2D' ).addEventListener( 'click', move2DMode, false );
    document.getElementById( 'label' ).addEventListener( 'click', labelMode, false );
    document.getElementById( 'file_input' ).addEventListener( 'change', upload_file, false );
    document.getElementById( 'draw-box').addEventListener( 'click', drawBox, false );
}

function getMin(v1, v2) {
    return new THREE.Vector3(Math.min(v1.x, v2.x), 
                             Math.min(v1.y, v2.y), 
                             Math.min(v1.z, v2.z))
}

function getMax(v1, v2) {
    return new THREE.Vector3(Math.max(v1.x, v2.x), 
                             Math.max(v1.y, v2.y), 
                             Math.max(v1.z, v2.z))
}

function onDocumentMouseMove( event ) {

    event.preventDefault();
    if (mouseDown == true) {
        var cursor = get3DCoord();
        if (cursor.x != anchor.x && cursor.y != anchor.y && cursor.z != anchor.z) {
            if (newBox != null) {
                scene.add( newBox );
            }
            var minVector = getMin(cursor, anchor);
            var maxVector = getMax(cursor, anchor);
            newBoundingBox.set(minVector, maxVector);
        }
        
    }
}

function onDocumentMouseUp( event ) {

    event.preventDefault();
    mouseDown = false;
    newBox = null;
}

function onDocumentMouseDown( event ) {

    event.preventDefault();
    if (!controls.enabled) {
        mouseDown = true;
        anchor = get3DCoord();
        var v = anchor.clone();
        anchor.x += .000001;
        anchor.y -= .000001;
        anchor.z += .000001;
        
        newBoundingBox = new THREE.Box3(anchor, v);
        anchor = anchor.clone();
        newBox = new THREE.Box3Helper( newBoundingBox, 0xffff00 );
    }
}

function get3DCoord() {
    mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
    mouse.z = 0.5;
    mouse.unproject( camera );
    var dir = mouse.sub( camera.position ).normalize();
    var distance = - camera.position.y / dir.y;
    var pos = camera.position.clone().add( dir.multiplyScalar( distance ) );
    return pos;
}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

}

function animate() {

    requestAnimationFrame( animate );

    render();
    stats.update();

}

var toggle = 0;

function render() {

    raycaster.setFromCamera( mouse, camera );

    var intersections = raycaster.intersectObjects( [pointcloud] );
    intersection = ( intersections.length ) > 0 ? intersections[ 0 ] : null;
    // if point is clicked on, color with red sphere
    if ( toggle > 0.005 && intersection !== null && !(
            pointsWithSpheres.has(intersection.index)) && mouseDown
            && !controls.enabled) {
        var point = pointcloud.geometry.vertices[intersection.index];
        var sphere = new THREE.Mesh( sphereGeometry, sphereMaterial );
        sphere.position.copy( point );
        scene.add(sphere);
        spheres.push(sphere);
        pointsWithSpheres.add(intersection.index);
        selectedPoints.push(point);
        toggle = 0;
    }

    toggle += clock.getDelta();

    renderer.render( scene, camera );

}

function show() {
    var rotation = 0;

    if (pointcloud !== undefined) {
        scene.remove(pointcloud);
        rotation = pointcloud.rotation.y;
    }
    // add pointcloud to scene
    pointcloud = generatePointCloudForCluster();
    pointcloud.rotation.y = rotation;
    scene.add( pointcloud );
}

function generatePointCloudForCluster() {
    return generatePointCloud(data, new THREE.Color( 0,1,0 ));
}

function moveMode( event ) {
    console.log(camera.rotation);
    event.preventDefault();
    controls.enabled = true;
    move2D = false;
    document.getElementById( 'label' ).className = "";
    document.getElementById( 'move2D' ).className = "";
    document.getElementById( 'move' ).className = "selected";
    controls.maxPolarAngle = 2 * Math.PI;
    controls.minPolarAngle = -2 * Math.PI;
}

function move2DMode( event ) {
    event.preventDefault();
    controls.enabled = true;
    controls.update();
    document.getElementById( 'move' ).className = "";
    document.getElementById( 'label' ).className = "";
    document.getElementById( 'move2D' ).className = "selected";
    if (!move2D) {
        start = camera.rotation;
        // end = dt * start.y;
        // loop();
        // renderer.render(scene, camera);
        camera.rotation.y = 0;
        controls.maxPolarAngle = 0;
        controls.minPolarAngle = 0;
        // camera.position.set(0, 100, 0);
        // camera.lookAt(new THREE.Vector3(0,0,0));
    }
    move2D = true;
}

function labelMode( event ) {
    event.preventDefault();
    if (move2D) {
        controls.enabled = false;
        controls.update();
        document.getElementById( 'label' ).className = "selected";
        document.getElementById( 'move' ).className = "";
        document.getElementById( 'move2D' ).className = "";

    }
}

// linear interpolation function
function lerp(a, b, t) {return a + (b - a) * t}


function loop() {
    for (var i = 0; i < 100; i++) {
        camera.rotation.y -= end;
        controls.update();
        // render();
        // requestAnimationFrame(render);
        // renderer.render(scene, camera);
        console.log("loop " + i);
    }
  // var newX = lerp(a.x, b.x, ease(t));   // interpolate between a and b where
  // var newY = lerp(a.y, b.y, ease(t));   // t is first passed through a easing
  // var newZ = lerp(a.z, b.z, ease(t));   // function in this example.
  // mesh.position.set(newX, newY, newZ);  // set new position
  // t += dt;
  // if (t <= 0 || t >=1) dt = -dt;        // ping-pong for demo
  
  // t += dt;
  // renderer.render(scene, camera);
  // requestAnimationFrame(loop);
}


function save() {
    textContents = [];
    var numHighlighted = 0
    for (var i=0;i<pointcloud.geometry.vertices.length;i++) {
        var point = pointcloud.geometry.vertices[i];
        var highlighted = pointsWithSpheres.has(i) ? 1 : 0;
        numHighlighted += highlighted;
        string = "%f,%f,%f,%d\n".format(point.x, point.y, point.z, highlighted);
        textContents.push(string);
    }
    console.log('Number of highlighted points: ' + numHighlighted.toString());
    var blob = new Blob(textContents, {type: "text/plain;charset=utf-8"});
    saveAs(blob, "labelled.csv");
}

function save_image() {
    renderer.domElement.toBlob(function (blob) {
        saveAs(blob, "image.png");
    });
}

function upload_file() {
    var x = document.getElementById("file_input");
    if (x.files.length > 0) {
        var file = x.files[0];
        load_text_file(file, import_annotations_from_bin);
    }
}

function import_annotations_from_bin(data) {
  if ( data === '' || typeof(data) === 'undefined') {
    return;
  }
}


function load_text_file(text_file, callback_function) {
  if (text_file) {
    var text_reader = new FileReader();
    text_reader.readAsArrayBuffer(text_file);
    text_reader.onload = readData;
    image_loaded = true;
  }
}

function readData(e) {
    var rawLog = this.result;
    // console.log(rawLog);
    var floatarr = new Float32Array(rawLog)
    
    data = floatarr;
    // console.log(data);
    // console.log(data.length);

    show();
    animate();
}


function drawBox() {    
    var boundingBox = new THREE.Box3();
    boundingBox.setFromPoints(selectedPoints);
    console.log(boundingBox);
    console.log(selectedPoints);
    var helper = new THREE.Box3Helper( boundingBox, 0xffff00 );
    boundingBoxes.push(boundingBox);
    boxMap.set(boundingBox, selectedPoints);
    selectedPoints = [];
    scene.add( helper );
}

// https://stackoverflow.com/a/15327425/4855984
String.prototype.format = function(){
    var a = this, b;
    for(b in arguments){
        a = a.replace(/%[a-z]/,arguments[b]);
    }
    return a; // Make chainable
};