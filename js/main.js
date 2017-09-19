if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

var renderer, scene, camera, stats;
var pointcloud;
var raycaster;
var mouse = new THREE.Vector2();
var intersection = null;
var spheres = [];
var pointsWithSpheres = new Set();
var clock;
var mouseDown;
var highlightMode = false;

var threshold = 0.1;
var pointSize = 0.5;

init();
animate();

// Should be in init?
var sphereGeometry, sphereMaterial;

function generatePointCloudGeometry( vertices, color ){

    var geometry = new THREE.BufferGeometry();

    var positions = new Float32Array( vertices.length*3 );
    var colors = new Float32Array( vertices.length*3 );

    var k = 0;

    for ( var i = 0, l = vertices.length; i < l; i ++ ) {

        vertex = vertices[ i ];
        positions[ 3 * k ] = vertex.x;
        positions[ 3 * k + 1 ] = vertex.y;
        positions[ 3 * k + 2 ] = vertex.z;

        var intensity = ( vertex.y + 0.1 ) * 5;
        colors[ 3 * k ] = color.r * intensity;
        colors[ 3 * k + 1 ] = color.g * intensity;
        colors[ 3 * k + 2 ] = color.b * intensity;

        k++;
    }

    geometry.addAttribute( 'position', new THREE.BufferAttribute( positions, 3 ) );
    geometry.addAttribute( 'color', new THREE.BufferAttribute( colors, 3 ) );
    geometry.computeBoundingBox();

    return geometry;

}


function generatePointCloud( vertices, color ) {

    var geometry = new THREE.Geometry();

    var colors = [];

    var k = 0;

    for ( var i = 0, l = vertices.length; i < l; i ++ ) {

        vertex = vertices[ i ];
        var v = new THREE.Vector3( vertex.x, vertex.y, vertex.z );
        geometry.vertices.push( v );

        var intensity = ( vertex.y + 0.1 ) * 7;
        colors[ k ] = ( color.clone().multiplyScalar( intensity ) );

        k++;
    }

    geometry.colors = colors;
    geometry.computeBoundingBox();

    var material = new THREE.PointsMaterial( { size: pointSize, vertexColors: THREE.VertexColors } );
    var pointcloud = new THREE.Points( geometry, material );

    return pointcloud;

}

function init() {

    var container = document.getElementById( 'container' );

    scene = new THREE.Scene();

    clock = new THREE.Clock();

    camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 10000 );
    camera.position.y = 25;
    camera.position.z = 37;

    //

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
    controls.enabled = false;

    //

    window.addEventListener( 'resize', onWindowResize, false );
    document.addEventListener( 'mousemove', onDocumentMouseMove, false );
    document.addEventListener( 'mousedown', onDocumentMouseDown, false );
    document.addEventListener( 'mouseup', onDocumentMouseUp, false );
    document.getElementById( 'save' ).addEventListener( 'click', save, false );
    document.getElementById( 'export' ).addEventListener( 'click', save_image, false );
    document.getElementById( 'move' ).addEventListener( 'click', moveMode, false );
    document.getElementById( 'label' ).addEventListener( 'click', labelMode, false );

    //

    initNav();
    show(document.getElementById('obj0'), Object.keys(data)[0]);

}

function onDocumentMouseMove( event ) {

    event.preventDefault();

    mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

}

function onDocumentMouseUp( event ) {

    event.preventDefault();
    mouseDown = false;

}

function onDocumentMouseDown( event ) {

    event.preventDefault();
    mouseDown = true;

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

    if ( toggle > 0.005 && intersection !== null && !(
            pointsWithSpheres.has(intersection.index)) && mouseDown
            && !controls.enabled) {

        var point = pointcloud.geometry.vertices[intersection.index];
        var sphere = new THREE.Mesh( sphereGeometry, sphereMaterial );
        sphere.position.copy( point );
        scene.add(sphere);
        spheres.push(sphere);
        pointsWithSpheres.add(intersection.index);

        toggle = 0;
    }

    toggle += clock.getDelta();

    renderer.render( scene, camera );

}

// Navigation Bar

function initNav() {
    navigation = document.getElementById('navigation');
    var i = 0;
    for (key in data) {
        var li = document.createElement('li');
        var element = document.createElement('a');
        li.appendChild(element);
        element.innerHTML = i + 1;
        element.id = 'obj' + i;
        wrapper = function(key) { return function() { show(this, key); }}
        element.onclick = wrapper(key);
        navigation.appendChild(li);
        i += 1;
    }
}

function clearNav() {
    for (var i = 0; i < Object.keys(data).length; i++) {
        document.getElementById('obj' + i).className = '';
    }
}

function show(button, obj_name) {
    clearNav();
    button.className += "selected";
    var rotation = 0;

    if (pointcloud !== undefined) {
        scene.remove(pointcloud);
        rotation = pointcloud.rotation.y;
    }

    pointcloud = generatePointCloudForCluster( obj_name );
    pointcloud.rotation.y = rotation;
    scene.add( pointcloud );
}

function generatePointCloudForCluster(obj_name) {
    return generatePointCloud(data[obj_name]['vertices'], new THREE.Color( 0,1,0 ));
}

function moveMode( event ) {
    event.preventDefault();
    controls.enabled = true;
    document.getElementById( 'label' ).className = "";
    document.getElementById( 'move' ).className = "selected";
}

function labelMode( event ) {
    event.preventDefault();
    controls.enabled = false;
    document.getElementById( 'label' ).className = "selected";
    document.getElementById( 'move' ).className = "";
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

// https://stackoverflow.com/a/15327425/4855984
String.prototype.format = function(){
    var a = this, b;
    for(b in arguments){
        a = a.replace(/%[a-z]/,arguments[b]);
    }
    return a; // Make chainable
};
