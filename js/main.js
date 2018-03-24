

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
var newBoxHelper;

var newBoundingBox2;
var newBox2;

var mouse = new THREE.Vector3();
var anchor = new THREE.Vector3();

var boxgeometry = new THREE.BoxGeometry( 1, 1, 1 );
var boxmaterial = new THREE.MeshDepthMaterial( {opacity: .1} );
var move2D = false;

var start, end;
var angle;

var pointMaterial = new THREE.PointsMaterial( { size: pointSize, vertexColors: THREE.VertexColors } );
init();
// animate();

// Should be in init?
var sphereGeometry, sphereMaterial;


function generatePointCloud( vertices, color ) {

    var geometry = new THREE.Geometry();

    var colors = [];

    var k = 0;
    var stride = 32;
    for ( var i = 0, l = 0; i < l; i ++ ) {
        // creates new vector from a cluster and adds to geometry
        var v = new THREE.Vector3( vertices[ stride * k + 1 ], 
            vertices[ stride * k + 2 ], vertices[ stride * k ] );

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

function Box(anchor, cursor, boundingBox, boxHelper) {
    this.color = new THREE.Color( 0,1,0 );
    this.anchor = anchor;
    this.geometry = new THREE.Geometry();
    this.points = new THREE.Points( this.geometry, pointMaterial );
    this.geometry.vertices.push(anchor);
    this.boundingBox = boundingBox;
    this.boxHelper = boxHelper;
    this.colors = [];
    for (var i = 0; i < 5; i++) {
        this.colors.push( this.color.clone().multiplyScalar( 7 ) );
    }
    this.geometry.colors = this.colors;

    this.cursor = cursor.clone();
    this.geometry.vertices.push(cursor);
    this.geometry.vertices.push(getCenter(anchor, cursor));
    this.geometry.vertices.push(anchor.clone());
    this.geometry.vertices.push(cursor.clone());
    // this.geometry.computeBoundingBox();
    scene.add(this.points);
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
    // document.getElementById( 'save' ).addEventListener( 'click', save, false );
    // document.getElementById( 'export' ).addEventListener( 'click', save_image, false );
    document.getElementById( 'move' ).addEventListener( 'click', moveMode, false );
    document.getElementById( 'move2D' ).addEventListener( 'click', move2DMode, false );
    document.getElementById( 'label' ).addEventListener( 'click', labelMode, false );
    document.getElementById( 'file_input' ).addEventListener( 'change', upload_file, false );
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
                scene.add( newBox.boxHelper );
            }
            if (newBox2 != null) {
                // scene.add( newBox2 );
            }
            var angle = camera.rotation.z;
            newBox.cursor.x = cursor.x;
            newBox.cursor.y = cursor.y;
            newBox.cursor.z = cursor.z;

            console.log("cursor: ", cursor);
            console.log("anchor: ", newBox.anchor);

            newBox.geometry.vertices[1] = newBox.cursor.clone();

            var v1 = cursor.clone();
            var v2 = newBox.anchor.clone();

            var v3 = cursor.clone();
            var v4 = anchor.clone();
            
            // for rotation
            rotate(v1, v2, angle);
            console.log("v1: ", v1);
            console.log("v2: ", v2);

            newBox.geometry.vertices[2] = getCenter(v1, v2);
            newBox.geometry.vertices[3] = v1.clone();
            newBox.geometry.vertices[4] = v2.clone();

            var minVector = getMin(v1, v2);
            var maxVector = getMax(v1, v2);
            
            newBox.boundingBox.set(minVector, maxVector);
            // for rotation
            newBox.boxHelper.rotation.y = angle;

            var minVector2 = getMin(v3, v4);
            var maxVector2 = getMax(v3, v4);
            newBoundingBox2.set(minVector2, maxVector2);

            newBox.geometry.verticesNeedUpdate = true;

            // debug
            // console.log("v1: ", v1);
            // console.log("v2: ", v2);
            // console.log("v3: ", v3);
            // console.log("v4: ", v4);
            // console.log("angle: ", angle);
            // console.log("dist 1: ", minVector.distanceTo(maxVector));
            // console.log("dist 2: ", minVector2.distanceTo(maxVector2));
            // console.log("min 1: ", minVector);
            // console.log("min 2: ", minVector2);
            // console.log("center: ", getCenter(getMin(anchor, cursor), getMax(anchor, cursor)));
            // console.log("new center: ", getCenter(getMin(v1, v2), getMax(v1, v2)));

        }
        
    }
}

function getCenter(v1, v2) {
    return new THREE.Vector3((v1.x + v2.x) / 2.0, 0.0, (v1.z + v2.z) / 2.0);
}

function rotate(v1, v2, angle) {
    center = getCenter(v1, v2);
    v1.sub(center);
    v2.sub(center);
    var temp1 = v1.clone();
    var temp2 = v2.clone();
    v1.x = Math.cos(angle) * temp1.x - Math.sin(angle) * temp1.z;
    v2.x = Math.cos(angle) * temp2.x - Math.sin(angle) * temp2.z;

    v1.z = Math.sin(angle) * temp1.x + Math.cos(angle) * temp1.z;
    v2.z = Math.sin(angle) * temp2.x + Math.cos(angle) * temp2.z;

    v1.add(center);
    v2.add(center);
}

function onDocumentMouseUp( event ) {
    event.preventDefault();
    mouseDown = false;
    // newBox = null;

    newBox2 = null;
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
        newBoxHelper = new THREE.Box3Helper( newBoundingBox, 0xffff00 );
        anchor = anchor.clone();

        newBox = new Box(anchor, v, newBoundingBox, newBoxHelper);
        
        
        // console.log(camera.rotation);
        angle = camera.rotation.z;

        newBoundingBox2 = new THREE.Box3(anchor.clone(), v.clone());
        newBox2 = new THREE.Box3Helper( newBoundingBox2, 0xffff00 );
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
    // console.log(camera.rotation);
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
        camera.position.set(0, 100, 0);
        camera.lookAt(new THREE.Vector3(0,0,0));
        camera.rotation.y = 0;
        controls.maxPolarAngle = 0;
        controls.minPolarAngle = 0;
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
    var floatarr = new Float32Array(rawLog)
    data = floatarr;
    console.log(data[0]);
    show();
    animate();
}



// https://stackoverflow.com/a/15327425/4855984
String.prototype.format = function(){
    var a = this, b;
    for(b in arguments){
        a = a.replace(/%[a-z]/,arguments[b]);
    }
    return a; // Make chainable
};