

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
var pointSize = 1;

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
var rotatingBox;
var isResizing = false;
var isMoving = false;
var isRotating = false;
var grid;
var pointMaterial = new THREE.PointsMaterial( { size: pointSize * 4, sizeAttenuation: false, vertexColors: THREE.VertexColors } );

var yCoords = [];
init();

var id = 0;
// animate();



function normalizeColors(vertices, color) {
    var maxColor = Number.NEGATIVE_INFINITY;
    var minColor = Number.POSITIVE_INFINITY;
    var intensities = [];
    var colors = [];

    k = 0;
    var stride = 4;
    // finds max and min z coordinates
    for ( var i = 0, l = vertices.length / 4; i < l; i ++ ) {
        
        if (vertices[ stride * k + 2] > maxColor) {
            maxColor = vertices[ stride * k + 2];
        }
        if (vertices[ stride * k + 2] < minColor) {
            minColor = vertices[ stride * k + 2];
        }
        intensities.push(vertices[ stride * k + 2]);
        k++;
    }

    var mean = calculateMean(intensities);
    var sd = standardDeviation(intensities);
    var filteredIntensities = filter(intensities, mean, 2 * sd);
    var min = getMinElement(filteredIntensities);
    var max = getMaxElement(filteredIntensities);

    // normalize colors
    // if greater than 2 sd from mean, set to max color
    // if less than 2 sd from mean, set to min color
    // ortherwise normalize color based on min and max z-coordinates
    for ( var i = 0;  i < intensities.length; i ++ ) {
        var intensity = intensities[i];
        if (intensities[i] - mean >= 2 * sd) {
            intensity = 1;
        } else if (mean - intensities[i] >= 2 * sd) {
            intensity = 0;
        } else {
            intensity = (intensities[i] - min) / (max - min);
        }
        colors[i] = ( color.clone().multiplyScalar( intensity * 2 ) );
    }
    return colors;
}

function generatePointCloud( vertices, color ) {

    var geometry = new THREE.Geometry();

    var k = 0;
    var stride = 4;
    
    for ( var i = 0, l = vertices.length / 4; i < l; i ++ ) {
        // creates new vector from a cluster and adds to geometry
        var v = new THREE.Vector3( vertices[ stride * k + 1 ], 
            vertices[ stride * k + 2 ], vertices[ stride * k ] );

        // stores y coordinates into yCoords
        yCoords.push(vertices[ stride * k + 2 ]);
        
        // add vertex to geometry
        geometry.vertices.push( v );

        k++;
    }

    geometry.colors = normalizeColors(vertices, color);
    geometry.computeBoundingBox();

    var material = new THREE.PointsMaterial( { size: pointSize, sizeAttenuation: false, vertexColors: THREE.VertexColors } );
    // creates pointcloud given vectors
    var pointcloud = new THREE.Points( geometry, material );

    return pointcloud;

}


// called first, populates scene and initializes renderer
function init() {

    var container = document.getElementById( 'container' );
    scene = new THREE.Scene();
    clock = new THREE.Clock();

    // set up PerspectiveCamera
    camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 10000 );
    camera.position.set(0, 100, 0);
    camera.lookAt(new THREE.Vector3(0,0,0));

    //
    grid = new THREE.GridHelper( 200, 20, 0xffffff, 0xffffff );
    scene.add( grid );

    // set up renderer
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
    document.getElementById( 'move' ).addEventListener( 'click', moveMode, false );
    document.getElementById( 'move2D' ).addEventListener( 'click', move2DMode, false );
    document.getElementById( 'file_input' ).addEventListener( 'change', upload_file, false );
    document.addEventListener("keydown", onKeyDown);  //or however you are calling your method
    document.addEventListener("keyup", onKeyUp);
}

// controller for pressing hotkeys
function onKeyDown(event) {
    if (event.ctrlKey) {
        toggleControl(false);
    }
   var KeyID = event.keyCode;
   switch(KeyID)
   {
      case 8: // backspace
      deleteSelectedBox();
      break; 
      case 46: // delete
      deleteSelectedBox();
      break;
      case 68:
      default:
      break;
   }
}

// controller for releasing hotkeys
function onKeyUp(event) {
   var KeyID = event.keyCode;
   switch(KeyID)
   {
      default:
      toggleControl(true);
      break;
   }
}

// toggles between move2D and move3D
function toggleControl(b) {
    if (b) {
        controls.enabled = b;
        controls.update();
    } else {
        if (move2D) {
            controls.enabled = b;
            controls.update();
        }
    }
}

// deletes selected box when delete key pressed
function deleteSelectedBox() {
    if (selectedBox) {
        scene.remove(selectedBox.points);
        scene.remove(selectedBox.boxHelper);

        // deletes corresponding row in object id table
        deleteRow(selectedBox.id);

        // removes selected box from array of currently hovered boxes
        for (var i = 0; i < hoverBoxes.length; i++) {
            if (hoverBoxes[i] == selectedBox) {
                hoverBoxes.splice(i, 1);
                break;
            }
        }

        // removes selected box from array of bounding boxes
        for (var i = 0; i < boundingBoxes.length; i++) {
            if (boundingBoxes[i] == selectedBox) {
                boundingBoxes.splice(i, 1);
                break;
            }
        }

        // removes selected box
        selectedBox = null;
    }
}

// removes row of object id table given corrensponding bounding box id
function deleteRow(id) {
    var row = getRow(id);
    row.remove();
}

// gets 2D mouse coordinates
function updateMouse( event ) {
    event.preventDefault();
    mouse2D.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    mouse2D.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
}


// controller for resizing, rotating, translating, or hovering boxes and points
function onDocumentMouseMove( event ) {
    event.preventDefault();

    if (mouseDown == true) {
        var cursor = get3DCoord();

        if (isRotating) {

            rotateBox(rotatingBox, cursor);

        } else if (isResizing) {

            // cursor's y coordinate nudged to make bounding box matrix invertible
            cursor.y -= 0.00001;

            resize(resizeBox, cursor);

        } else if (isMoving) {

            moveBox(selectedBox, cursor);
            changeBoundingBoxColor(selectedBox, new THREE.Color( 0,0,7 ));

        } else {

            // if we are initoally drawing a new bounding box, 
            // we would like to add it to the scene
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
        // highlights all hover boxes that intersect with cursor
        updateHoverBoxes(cursor);

        // highlights closest corner point that intersects with cursor
        highlightCorners();
    } 
}






// updates hover boxes and changes their colors to blue
function updateHoverBoxes(v) {
    if (!isMoving) {
        hoverBoxes = [];
        for (var i = 0; i < boundingBoxes.length; i++) {
            var box = boundingBoxes[i];
            // added box to boverBoxes if cursor is within bounding box
            if (v && containsPoint(box, v)) {
                hoverBoxes.push(box);
            }

            // checks if box is selectedBox, if so changes color back to default
            if (box != selectedBox) {
                changeBoundingBoxColor(box, 0xffff00);
            }
        }

        // update color of hover box if only one box is hovered
        if (hoverBoxes.length == 1) {
            var box = hoverBoxes[0];
            if (box != selectedBox) {
                changeBoundingBoxColor(box, new THREE.Color( 7,0,0 ) );
            }
        }
    }
}





// method to add row to object id table
function addRow(box) {
    $("#object-table tbody").append("<tr><td class='id'>" + box.id + "</td><td><input type=text>" + "</input></td></tr>");
    $("#object-table tbody input").last().focus();
}

// handler that highlights input and corresponding bounding box when input ic selected
$("#object-table").on('mousedown', 'tbody tr', function() {
    isMoving = false;
    var boxId = $(this).find('.id').text();
    var box = getBoxById(boxId);
    selectRow(boxId);
    selectBox(box, null);
    selectedBox = null;
    });

// handler that saves input when input is changed
$("#object-table").on('change paste keyup', 'tbody tr', updateObjectId);

// method to update Box's object id
function updateObjectId() {    
    var boxId = $(this).find(".id").text();
    var input = $(this).find('input').val();
    var box = getBoxById(boxId);
    box.object_id = input;
}


// method to get object id table row given id
function getRow(id) {
    var row = $("#object-table tbody").find('td').filter(function() {
        return $(this).text() == id.toString();}).closest("tr");
    return row;
}

// method to select row of object id table given ids
function selectRow(id) {
    var row = getRow(id);    
    $('#object-table').find('input').attr('disabled','disabled');
    $(row).find('input').removeAttr('disabled');
    $(row).find('input').get(0).focus();
}



// gets box given its id
function getBoxById(id) {
    for (var i = 0; i < boundingBoxes.length; i++) {
        if (boundingBoxes[i].id == id) {
            return boundingBoxes[i];
        }
    }
}

// controller for adding box
function onDocumentMouseUp( event ) {
    event.preventDefault();
    mouseDown = false;
    if (newBox != null && newBox.added) {
        addBox(newBox);
    }
    newBox = null;
    isResizing = false;
    isRotating = false;
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
        // console.log("intersection: ", intersection);
        // update hover box
        if (selectedBox && (hoverBoxes.length == 0 || hoverBoxes[0] != selectedBox)) {
            changeBoundingBoxColor(selectedBox, 0xffff00);
            selectedBox = null;
            isMoving = false;
        }

        if (intersection != null) {
            var box = intersection[0];
            var closestIdx = closestPoint(anchor, box.geometry.vertices);
            // console.log("closest: ", closestIdx);
            if (closestIdx == 4) {
                isRotating = true;
                rotatingBox = box;
            } else {
                isResizing = true;
                resizeBox = box;
                resizeBox.anchor = resizeBox.geometry.vertices[getOppositeCorner(closestIdx)].clone();
            }
        } else if (hoverBoxes.length == 1) {
            isMoving = true;
            selectBox(hoverBoxes[0], get3DCoord());
            selectRow(selectedBox.id);

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


    if (move2D) {
        grid.rotation.y = camera.rotation.z;
    }
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
    // document.getElementById( 'label' ).className = "";
    document.getElementById( 'move2D' ).className = "";
    document.getElementById( 'move' ).className = "selected";
    controls.maxPolarAngle = 2 * Math.PI;
    controls.minPolarAngle = -2 * Math.PI;
    unprojectFromXZ();
}

function move2DMode( event ) {
    event.preventDefault();
    document.getElementById( 'move' ).className = "";
    // document.getElementById( 'label' ).className = "";
    document.getElementById( 'move2D' ).className = "selected";
    if (!move2D) {
        camera.position.set(0, 100, 0);
        camera.lookAt(new THREE.Vector3(0,0,0));
        // camera.rotation.y = 0;
        controls.maxPolarAngle = 0;
        controls.minPolarAngle = 0;
        camera.updateProjectionMatrix();
        projectOntoXZ();
        controls.reset();
    }
    controls.enabled = true;
    controls.update();
    move2D = true;
}

function projectOntoXZ() {
    for (var i = 0; i < pointcloud.geometry.vertices.length; i++) {
        var v = pointcloud.geometry.vertices[i];
        v.y = 0;
    }
    pointcloud.geometry.verticesNeedUpdate = true;
}

function unprojectFromXZ() {
    for (var i = 0; i < pointcloud.geometry.vertices.length; i++) {
        var v = pointcloud.geometry.vertices[i];
        v.y = yCoords[i];
    }
    pointcloud.geometry.verticesNeedUpdate = true;
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

var maxSize = 2;
var SettingsControls = function() {
                       this.size = pointSize / maxSize;
                };


var gui = new dat.GUI();
var settingsControls = new SettingsControls();
var settingsFolder = gui.addFolder('settings');
settingsFolder.add(settingsControls, 'size').min(0.0).max(1.0).step(0.05).onChange(function() {
    pointcloud.material.size = settingsControls.size * maxSize;
    pointMaterial.size = 4 * settingsControls.size * maxSize;
});

settingsFolder.open();

function reset() {
    // if (grid) {
    //     scene.remove(grid);
    //     scene.remove(pointcloud);
    // }
    if (boundingBoxes) {
        for (var i = 0; i < boundingBoxes.length; i++) {
            box = boundingBoxes[i];
            scene.remove(box.boxHelper);
            scene.remove(box.points);
            clearTable();
        }
        boundingBoxes = [];
        yCoords = [];
    }
}

function clearTable() {
    for (var i = 0; i < boundingBoxes.length; i++) {
            box = boundingBoxes[i];
            deleteRow(box.id);
        }
    id = 0;
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
    this.object_id = box.object_id;
}