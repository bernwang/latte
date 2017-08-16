if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

var renderer, scene, camera, stats;
var pointcloud;
var raycaster;
var mouse = new THREE.Vector2();
var intersection = null;
var spheres = [];
var sphereXs = new Set();
var clock;

var threshold = 0.1;
var pointSize = 0.5;

init();
animate();

// Should be in init?
var sphereGeometry = new THREE.SphereGeometry( 0.1, 32, 32 );
var sphereMaterial = new THREE.MeshBasicMaterial( { color: 0xff0000, shading: THREE.FlatShading } );

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
    camera.position.y = 50;
    camera.position.z = 75;

    //

    var sphereGeometry = new THREE.SphereGeometry( 0.1, 32, 32 );
    var sphereMaterial = new THREE.MeshBasicMaterial( { color: 0xff0000, shading: THREE.FlatShading } );

//    for ( var i = 0; i < 40; i++ ) {
//
//        var sphere = new THREE.Mesh( sphereGeometry, sphereMaterial );
//        scene.add( sphere );
//        spheres.push( sphere );
//
//    }

    //

    var grid = new THREE.GridHelper( 200, 20 );
    grid.setColors( 0xffffff, 0xffffff );
    scene.add( grid );

    //

    renderer = new THREE.WebGLRenderer();
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

    //

    window.addEventListener( 'resize', onWindowResize, false );
    document.addEventListener( 'mousemove', onDocumentMouseMove, false );

    //

    initNav();
    show(document.getElementById('obj0'), Object.keys(data)[0]);

}

function onDocumentMouseMove( event ) {

    event.preventDefault();

    mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

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

    var intersections = raycaster.intersectObjects( pointcloud );
    intersection = ( intersections.length ) > 0 ? intersections[ 0 ] : null;

    if ( toggle > 0.005 && intersection !== null && !(intersection.point.x in sphereXs)) {

        sphereXs.add(intersection.point.x);
        var sphere = new THREE.Mesh( sphereGeometry, sphereMaterial );
        sphere.position.copy( intersection.point );
        scene.add(sphere);
        spheres.push(sphere);
//        spheres[ spheresIndex ].position.copy( intersection.point );
//        spheres[ spheresIndex ].scale.set( 1, 1, 1 );
//        spheresIndex = ( spheresIndex + 1 ) % spheres.length;

        toggle = 0;

    }

//    for ( var i = 0; i < spheres.length; i++ ) {
//
//        var sphere = spheres[ i ];
//        sphere.scale.multiplyScalar( 0.98 );
//        sphere.scale.clampScalar( 0.01, 1 );
//
//    }

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

    var pcRegular = generatePointCloudForCluster( obj_name );
    pcRegular.rotation.y = rotation;
    scene.add( pcRegular );

    pointcloud = [pcRegular];
}

function generatePointCloudForCluster(obj_name) {
  return generatePointCloud(data[obj_name]['vertices'], new THREE.Color( 1,0,1 ));
}
