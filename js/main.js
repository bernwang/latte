

if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

var renderer, scene, camera, stats;
var pointcloud;
var raycaster;
var mouse2D = new THREE.Vector2();
var intersection = null;
var clock;
var mouseDown;
var highlightMode = false;
var threshold = 0.5;
var pointSize = 0.5;
// data structures
var data;
var boundingBoxes = [];
var image_loaded = false;
var hoverBoxes = [];
var newBox;
var newBoundingBox;
var newBoxHelper;

var mouse = new THREE.Vector3();
var anchor = new THREE.Vector3();
var currentPosition = new THREE.Vector3();

var boxgeometry = new THREE.BoxGeometry( 1, 1, 1 );
var boxmaterial = new THREE.MeshDepthMaterial( {opacity: .1} );
var move2D = false;
var selectedBox;
var angle;
var distanceThreshold = 1;
var hoverIdx;
var hoverBox;
var resizeBox;
var isResizing = false;
var isMoving = false;
var grid;
var pointMaterial = new THREE.PointsMaterial( { size: pointSize * 2, vertexColors: THREE.VertexColors } );
init();
// animate();

// Should be in init?
var sphereGeometry, sphereMaterial;

function calculateMean(arr) {
    var total = 0;
    for (var i = 0; i< arr.length; i++) {
        total += arr[i];
    }
    return total / arr.length;
}

function standardDeviation(arr) {
    var mean = calculateMean(arr);
    var variance = 0;
    for (var i = 0; i < arr.length; i++) {
        variance += Math.pow(arr[i] - mean, 2);
    }
    variance = variance / arr.length;
    return Math.pow(variance, 0.5);
}

function filter(arr, mean, thresh) {
    var result = [];
    for (var i = 0; i< arr.length; i++) {
        if (Math.abs(arr[i] - mean) < thresh) {
            result.push(arr[i]);
        }
    }
    return result;
}

function getMinElement(arr) {
    var min = Number.POSITIVE_INFINITY;
    for (var i = 0; i< arr.length; i++) {
        if (arr[i] < min) {
            min = arr[i];
        }
    }
    return min;
}

function getMaxElement(arr) {
    var max = Number.NEGATIVE_INFINITY;
    for (var i = 0; i< arr.length; i++) {
        if (arr[i] > max) {
            max = arr[i];
        }
    }
    return max;
}

function generatePointCloud( vertices, color ) {

    var geometry = new THREE.Geometry();

    var colors = [];

    var k = 0;
    var stride = 4;
    var maxColor = Number.NEGATIVE_INFINITY;
    var minColor = Number.POSITIVE_INFINITY;
    var intensities = [];
    for ( var i = 0, l = vertices.length / 4; i < l; i ++ ) {
        // creates new vector from a cluster and adds to geometry
        var v = new THREE.Vector3( vertices[ stride * k + 1 ], 
            vertices[ stride * k + 2 ], vertices[ stride * k ] );
        if (vertices[ stride * k + 2] > maxColor) {
            maxColor = vertices[ stride * k + 2];
        }
        if (vertices[ stride * k + 2] < minColor) {
            minColor = vertices[ stride * k + 2];
        }
        geometry.vertices.push( v );
        intensities.push(vertices[ stride * k + 2]);
        // var intensity = ( 1 ) * 7;
        // colors[ k ] = ( color.clone().multiplyScalar( intensity ) );

        k++;
    }
    var mean = calculateMean(intensities);
    var sd = standardDeviation(intensities);
    var filteredIntensities = filter(intensities, mean, 2 * sd);
    var min = getMinElement(filteredIntensities);
    var max = getMaxElement(filteredIntensities);
    for ( var i = 0;  i < intensities.length; i ++ ) {
        var intensity = intensities[i];
        if (Math.abs(intensities[i] - mean) >= 2 * sd) {
            intensity = 0;
        } else {
            intensity = (intensities[i] - min) / (max - min);
        }
        // var intensity = intensities[i];
        if (i % 512 == 0) {
            console.log(intensity);
        }
        colors[i] = ( color.clone().multiplyScalar( intensity * 2 ) );
    }
    console.log("min color: ", minColor);
    console.log("max color: ", maxColor);
    geometry.colors = colors;
    geometry.computeBoundingBox();

    var material = new THREE.PointsMaterial( { size: pointSize, vertexColors: THREE.VertexColors } );
    // creates pointcloud given vectors
    var pointcloud = new THREE.Points( geometry, material );

    return pointcloud;

}

function Box(anchor, cursor, angle, boundingBox, boxHelper) {
    this.color = new THREE.Color( 1,0,0 );
    this.angle = angle;
    this.anchor = anchor;
    this.geometry = new THREE.Geometry();
    // visualizes the corners (in the non-rotated coordinates) of the box
    this.points = new THREE.Points( this.geometry, pointMaterial );

    this.boundingBox = boundingBox; // Box3; sets the size of the box
    this.boxHelper = boxHelper; // BoxHelper; helps visualize the box
    this.colors = []; // colors of the corner points
    for (var i = 0; i < 5; i++) {
        this.colors.push( this.color.clone().multiplyScalar( 7 ) );
    }
    this.geometry.colors = this.colors;
    this.cursor = cursor.clone();
    // order of corners is max, min, topleft, bottomright
    this.geometry.vertices.push(anchor);
    this.geometry.vertices.push(cursor);
    this.geometry.vertices.push(anchor.clone());
    this.geometry.vertices.push(cursor.clone());

    this.points.frustumCulled = false;
    this.added = false;



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
    sphereMaterial = new THREE.MeshBasicMaterial( { color: 0xff0000, flatShading: THREE.FlatShading } );

    //

    grid = new THREE.GridHelper( 200, 20, 0xffffff, 0xffffff );
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

    window.addEventListener( 'resize', onWindowResize, false );
    document.getElementById('container').addEventListener( 'mousemove', onDocumentMouseMove, false );
    document.getElementById('container').addEventListener( 'mousedown', onDocumentMouseDown, false );
    document.getElementById('container').addEventListener( 'mouseup', onDocumentMouseUp, false );
    document.addEventListener( 'mousemove', updateMouse, false );
    document.getElementById( 'save' ).addEventListener( 'click', save, false );
    // document.getElementById( 'export' ).addEventListener( 'click', save_image, false );
    document.getElementById( 'move' ).addEventListener( 'click', moveMode, false );
    document.getElementById( 'move2D' ).addEventListener( 'click', move2DMode, false );
    document.getElementById( 'label' ).addEventListener( 'click', labelMode, false );
    document.getElementById( 'file_input' ).addEventListener( 'change', upload_file, false );
    document.addEventListener("keydown", KeyCheck);  //or however you are calling your method
}

function KeyCheck(event)
{
   var KeyID = event.keyCode;
   switch(KeyID)
   {
      case 8: // backspace
      deleteSelectedBox();
      break; 
      case 46: // delete
      deleteSelectedBox();
      break;
      default:
      break;
   }
}

function deleteSelectedBox() {
    if (selectedBox) {
        scene.remove(selectedBox.points);
        scene.remove(selectedBox.boxHelper);
        for (var i = 0; i < hoverBoxes.length; i++) {
            if (hoverBoxes[i] == selectedBox) {
                hoverBoxes.splice(i, 1);
                break;
            }
        }
        for (var i = 0; i < boundingBoxes.length; i++) {
            if (boundingBoxes[i] == selectedBox) {
                boundingBoxes.splice(i, 1);
                break;
            }
        }
        selectedBox = null;
    }
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

function getTopLeft(v1, v2) {
    return new THREE.Vector3(Math.min(v1.x, v2.x), 
                             Math.max(v1.y, v2.y), 
                             Math.max(v1.z, v2.z))
}

function getBottomRight(v1, v2) {
    return new THREE.Vector3(Math.max(v1.x, v2.x), 
                             Math.min(v1.y, v2.y), 
                             Math.min(v1.z, v2.z))
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

function updateMouse( event ) {
    event.preventDefault();
    mouse2D.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    mouse2D.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
}

function getOppositeCorner(idx) {
    if (idx == 0) {return 1;}
    if (idx == 1) {return 0;}
    if (idx == 2) {return 3;}
    return 2;
}

function resize(box, cursor) {
    if (cursor.x != box.anchor.x && cursor.y != box.anchor.y && cursor.z != box.anchor.z) {

        var v1 = cursor.clone();
        var v2 = box.anchor.clone();

        v1.y = 0;
        v2.y = 0;
        
        // for rotation
        rotate(v1, v2, box.angle);


        var minVector = getMin(v1, v2);
        var maxVector = getMax(v1, v2);
        var topLeft = getTopLeft(v1, v2);
        var bottomRight = getBottomRight(v1, v2);

        maxVector.y = 0.00001; // need to do this to make matrix invertible

        box.boundingBox.set(minVector.clone(), maxVector.clone());
        // for rotation
        box.boxHelper.rotation.y = box.angle;

        maxVector.y = 0;
        rotate(minVector, maxVector, -box.angle);
        rotate(topLeft, bottomRight, -box.angle);

        // set corner points
        box.geometry.vertices[0] = maxVector.clone();
        box.geometry.vertices[1] = minVector.clone();
        box.geometry.vertices[2] = topLeft.clone();
        box.geometry.vertices[3] = bottomRight.clone();


        box.geometry.verticesNeedUpdate = true;
    }
}
function onDocumentMouseMove( event ) {
    event.preventDefault();
    // if (move2D) {
    //     console.log(camera.rotation.z);
    //     grid.rotation.y = camera.rotation.z;
    // }
    if (mouseDown == true) {
        var cursor = get3DCoord();

        if (isResizing) {
            cursor.y -= 0.00001;
            resize(resizeBox, cursor);
        } else if (isMoving) {
            moveBox(selectedBox, cursor);
            changeBoundingBoxColor(selectedBox, new THREE.Color( 0,0,7 ));
        } else {
            if (newBox != null && !newBox.added) {
                scene.add(newBox.points);
                scene.add( newBox.boxHelper );
                newBox.added = true;
            }
            resize(newBox, cursor);
        }
    }

    var cursor = getCurrentPosition();
    if (!controls.enabled) {
        updateHoverBoxes(cursor);
    }

    if (!controls.enabled) {
            var intersection = intersectWithCorner();
        if (intersection) {
            var box = intersection[0];
            var p = intersection[1];
            var closestIdx = closestPoint(p, box.geometry.vertices);
            if (hoverBox) {
                hoverBox.colors[hoverIdx] = new THREE.Color( 7,0,0 );
                hoverBox.geometry.colorsNeedUpdate = true;
            }

            hoverBox = box;
            hoverIdx = closestIdx;
            box.colors[closestIdx] = new THREE.Color( 0,0,7 );
            box.geometry.colorsNeedUpdate = true;
        } else {
            if (hoverBox) {
                hoverBox.colors[hoverIdx] = new THREE.Color( 7,0,0 );
                hoverBox.geometry.colorsNeedUpdate = true;
            }
            hoverBox = null;
        }
    
    }
    
    
    
}

function moveBox(box, v) {
    var dx = v.x - box.cursor.x;
    var dz = v.z - box.cursor.z;

    box.anchor.x += dx;
    box.anchor.z += dz;
    box.cursor = v.clone();
    for (var i = 0; i < box.geometry.vertices.length; i++) {
        var p = box.geometry.vertices[i];
        p.x += dx;
        p.z += dz;
    }


    var maxVector = box.geometry.vertices[0].clone();
    var minVector = box.geometry.vertices[1].clone();
    var topLeft = box.geometry.vertices[2].clone();
    var bottomRight = box.geometry.vertices[3].clone();

    rotate(maxVector, minVector, box.angle);
    rotate(topLeft, bottomRight, box.angle);
    maxVector.y += 0.0000001; // need to do this to make matrix invertible
    box.boundingBox.set(minVector, maxVector);

    box.geometry.verticesNeedUpdate = true;
}

function containsPoint(box, v) {
    var center = getCenter(box.boundingBox.max, box.boundingBox.min);
    var diff = v.clone();
    diff.sub(center);
    var v1 = v.clone();
    var v2 = center;
    v2.sub(diff);
    rotate(v1, v2, box.angle);
    return box.boundingBox.containsPoint(v2);
}

function updateHoverBoxes(v) {
    if (!isMoving) {
        hoverBoxes = [];
        for (var i = 0; i < boundingBoxes.length; i++) {
            var box = boundingBoxes[i];
            if (containsPoint(box, v)) {
                hoverBoxes.push(box);
            }
            if (box != selectedBox) {
                changeBoundingBoxColor(box, 0xffff00);
            }
        }
        if (hoverBoxes.length == 1) {
            var box = hoverBoxes[0];
            if (box != selectedBox) {
                changeBoundingBoxColor(box, new THREE.Color( 7,0,0 ) );
            }
        }
    }
}

function changeBoundingBoxColor(box, color) {
    var boxHelperCopy = new THREE.Box3Helper( box.boundingBox, color );
    scene.remove(box.boxHelper);
    scene.add(boxHelperCopy);
    box.boxHelper = boxHelperCopy;
    boxHelperCopy.rotation.y = box.angle;
}


function onDocumentMouseUp( event ) {
    event.preventDefault();
    mouseDown = false;
    if (newBox != null && newBox.added) {
        boundingBoxes.push(newBox);
    }
    newBox = null;
    isResizing = false;
    // if (isMoving) {
    //     changeBoundingBoxColor(hoverBoxes[0], new THREE.Color( 7,0,0 ));
    // }
    isMoving = false;
}

function onDocumentMouseDown( event ) {

    event.preventDefault();
    // if (move2D) {
    //     console.log(camera.rotation.z);
    //     grid.rotation.y = camera.rotation.z;
    // }
    if (!controls.enabled) {
        mouseDown = true;
        anchor = get3DCoord();
        var intersection = intersectWithCorner();
        // update hover box
        if (selectedBox && (hoverBoxes.length == 0 || hoverBoxes[0] != selectedBox)) {
            changeBoundingBoxColor(selectedBox, 0xffff00);
            selectedBox = null;
            isMoving = false;
        }

        if (intersection != null) {
            isResizing = true;
            resizeBox = intersection[0];
            var closestIdx = closestPoint(anchor, resizeBox.geometry.vertices);
            resizeBox.anchor = resizeBox.geometry.vertices[getOppositeCorner(closestIdx)].clone();
        } else if (hoverBoxes.length == 1) {
            selectedBox = hoverBoxes[0];
            selectedBox.cursor = get3DCoord();
            changeBoundingBoxColor(selectedBox, new THREE.Color( 0,0,7 ));
            isMoving = true;
        } else {
            angle = camera.rotation.z;
            var v = anchor.clone();
            anchor.x += .000001;
            anchor.y -= .000001;
            anchor.z += .000001;
            newBoundingBox = new THREE.Box3(anchor, v);
            newBoxHelper = new THREE.Box3Helper( newBoundingBox, 0xffff00 );
            anchor = anchor.clone();

            newBox = new Box(anchor, v, angle, newBoundingBox, newBoxHelper);
        }
    }
}

function intersectWithCorner() {
    if (boundingBoxes.length == 0) {
        return null;
    }
    var closestBox = null;
    var closestCorner = null;
    var shortestDistance = Number.POSITIVE_INFINITY;
    for (var i = 0; i < boundingBoxes.length; i++) {
        var b = boundingBoxes[i];
        var intersection = getIntersection(b);
        if (intersection) {
            if (intersection.distance < shortestDistance) {
                closestBox = b;
                closestCorner = intersection.point;
                shortestDistance = intersection.distance;
            }
        }
    }
    if (closestCorner) {
        return [closestBox, closestCorner];
    } else {
        return null;
    }
}

function getIntersection(b) {
    var temp = new THREE.Vector3(mouse2D.x, mouse2D.y, 0);
    temp.unproject( camera );
    var dir = temp.sub( camera.position ).normalize();
    var distance = - camera.position.y / dir.y;
    var pos = camera.position.clone().add( dir.multiplyScalar( distance ) );
    var shortestDistance = Number.POSITIVE_INFINITY;
    var closestCorner = null;
    for (var i = 0; i < b.geometry.vertices.length; i++) {
        if (distance2D(pos, b.geometry.vertices[i]) < shortestDistance &&
            distance2D(pos, b.geometry.vertices[i]) < distanceThreshold) {
            shortestDistance = distance2D(pos, b.geometry.vertices[i]);
            closestCorner = b.geometry.vertices[i];
        }
    }
    if (closestCorner == null) {
        return null;
    }
    return {distance: shortestDistance, point: closestCorner};
}

function distance2D(v1, v2) {
    return Math.pow(Math.pow(v1.x - v2.x, 2) + Math.pow(v1.z - v2.z, 2), 0.5)
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


function closestPoint(p, vertices) {
    var shortestDistance = Number.POSITIVE_INFINITY;
    var closestIdx = null;
    for (var i = 0; i < vertices.length; i++) {
        if (p.distanceTo(vertices[i]) < shortestDistance) {
            shortestDistance = p.distanceTo(vertices[i]);
            closestIdx = i;
        }
    }
    return closestIdx;
}

function getCurrentPosition() {
    var temp = new THREE.Vector3(mouse2D.x, mouse2D.y, 0);
    temp.unproject( camera );
    var dir = temp.sub( camera.position ).normalize();
    var distance = - camera.position.y / dir.y;
    var pos = camera.position.clone().add( dir.multiplyScalar( distance ) );
    return pos;
}

var toggle = 0;
function render() {
    toggle += clock.getDelta();
    renderer.render( scene, camera );
    // console.log("1: ", grid.rotation);
    // if (move2D) {
    //     scene.remove(grid);
    //     // grid.rotation.y = camera.rotation.y;
    //     grid.rotateY(camera.rotation.y);
    //     grid.updateMatrix();
    //     scene.add(grid);
    //     // grid.matrixWorldNeedsUpdate = true;
    //     console.log(grid.rotation);

    // }
    
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
    document.getElementById( 'move' ).className = "";
    document.getElementById( 'label' ).className = "";
    document.getElementById( 'move2D' ).className = "selected";
    if (!move2D) {
        camera.position.set(0, 100, 0);
        camera.lookAt(new THREE.Vector3(0,0,0));
        camera.rotation.y = 0;
        controls.maxPolarAngle = 0;
        controls.minPolarAngle = 0;
        camera.updateProjectionMatrix();
        controls.reset();
    }
    controls.enabled = true;
    controls.update();
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


function OutputBox(box) {
    var v1 = box.geometry.vertices[0];
    var v2 = box.geometry.vertices[1];
    var v3 = box.geometry.vertices[2];
    var center = getCenter(v1, v2);
    this.center = new THREE.Vector2(center.x, center.z);
    this.width = distance2D(v1, v3);
    this.length = distance2D(v2, v3);
    this.angle = box.angle;
} 

function save() {
  var outputBoxes = []
  for (var i = 0; i < boundingBoxes.length; i++) {
    outputBoxes.push(new OutputBox(boundingBoxes[i]));
  }
  var output = {"bounding boxes": outputBoxes};
  var stringifiedOutput = JSON.stringify(output);
  var file = new File([stringifiedOutput], "test.json", {type: "/json;charset=utf-8"});
  saveAs(file);
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