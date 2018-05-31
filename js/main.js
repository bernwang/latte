// TODO: Fix bug where there is a phantom box in the next frame when you delete a box
//

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
var hoverIdx;
var hoverBox;
var resizeBox;
var rotatingBox;
var isResizing = false;
var isMoving = false;
var isRotating = false;
var grid;
var pointMaterial = new THREE.PointsMaterial( { size: pointSize * 4, sizeAttenuation: false, vertexColors: THREE.VertexColors } );

var evaluator;
var yCoords = [];
var isRecording = false;
var evaluators;
var evaluation;
init();

var id = 0;
// animate();

var mean, sd, filteredIntensities, min, max, intensities, colors;
var selected_color = new THREE.Color(0x78F5FF);
var hover_color = new THREE.Color(1, 0, 0);
var default_color = new THREE.Color(0xffff00);

function normalizeColors(vertices, color) {
    var maxColor = Number.NEGATIVE_INFINITY;
    var minColor = Number.POSITIVE_INFINITY;
    intensities = [];
    colors = [];

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

    mean = calculateMean(intensities);
    sd = standardDeviation(intensities);
    filteredIntensities = filter(intensities, mean, 1 * sd);
    min = getMinElement(filteredIntensities);
    max = getMaxElement(filteredIntensities);

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
        // colors[i] = ( color.clone().multiplyScalar( intensity * 2 ) );
        colors[i] = ( new THREE.Color( intensity, 0, 1 - intensity).multiplyScalar(intensity * 5));

        // if (colors[i].b > colors[i].r) {
        //     colors[i] = colors[i].multiplyScalar(0);
        // }
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

    evaluators = [];
    evaluation = new Evaluation();

    window.addEventListener( 'resize', onWindowResize, false );
    document.getElementById('container').addEventListener( 'mousemove', onDocumentMouseMove, false );
    document.getElementById('container').addEventListener( 'mousedown', onDocumentMouseDown, false );
    document.getElementById('container').addEventListener( 'mouseup', onDocumentMouseUp, false );
    document.addEventListener( 'mousemove', updateMouse, false );
    // document.getElementById( 'save' ).addEventListener( 'click', save, false );
    document.getElementById( 'next_frame' ).addEventListener( 'click', next_frame, false );
    document.getElementById( 'move' ).addEventListener( 'click', moveMode, false );
    document.getElementById( 'move2D' ).addEventListener( 'click', move2DMode, false );
    document.getElementById( 'file_input' ).addEventListener( 'change', upload_files, false );
    document.addEventListener("keydown", onKeyDown);  //or however you are calling your method
    document.addEventListener("keyup", onKeyUp);
    document.getElementById( 'record' ).addEventListener( 'click', toggleRecord, false );
}

function next_frame(event) {
    if (evaluation.is_done()) {
        alert("You have completed the evaluation! Thank you for participating!");
        evaluator.pause_recording();
        evaluation.add_evaluator(evaluator);
        evaluation.write_output();
        return;
    } 
    var response = confirm('Do you want to move on to the next frame? You cannot go back to edit previous frames.');

    if (response == true) {
        $("#next_frame").text("Next Frame (" + (evaluation.get_frame_number() + 1) + 
                                "/" + evaluation.num_frames() + ")");
        evaluation.add_evaluator(evaluator);
        evaluation.next_frame();
        reset();
        data = evaluation.get_data();
        show();
        // animate();

        if (isRecording) {
            toggleRecord(event);
        }
        select2DMode();
    }
} 

function toggleRecord(event) {
    // pause recording
    if (isRecording) {
        $("#record").text("Click to resume recording");
        evaluator.pause_recording();
        move2DMode(event);
        isRecording = false;
        
    } else {
        // resume recording
        isRecording = true;
        $("#record").text("Click to pause recording");
        evaluator.resume_recording();
    }
}
// controller for pressing hotkeys
function onKeyDown(event) {
    if (isRecording) {
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
    
}

// controller for releasing hotkeys
function onKeyUp(event) {
    if(isRecording) {
        var KeyID = event.keyCode;
        switch(KeyID)
        {
          default:
          toggleControl(true);
          break;
        }
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
        evaluator.increment_delete_count();
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
    if (isRecording) {
        if (mouseDown == true) {
            var cursor = get3DCoord();

            if (isRotating) {

                rotatingBox.rotate(cursor);

            } else if (isResizing) {

                // cursor's y coordinate nudged to make bounding box matrix invertible
                cursor.y -= 0.00001;

                resizeBox.resize(cursor);

            } else if (isMoving) {

                selectedBox.translate(cursor);
                // selectedBox.changeBoundingBoxColor(new THREE.Color( 0,0,7 ));
                selectedBox.changeBoundingBoxColor(selected_color.clone());
            } else {

                // if we are initoally drawing a new bounding box, 
                // we would like to add it to the scene
                if (newBox != null && !newBox.added) {
                    scene.add(newBox.points);
                    scene.add( newBox.boxHelper );
                    newBox.added = true;
                }

                newBox.resize(cursor);

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
                box.changeBoundingBoxColor(default_color.clone());
            }
        }

        // update color of hover box if only one box is hovered
        if (hoverBoxes.length == 1) {
            var box = hoverBoxes[0];
            if (box != selectedBox) {
                // box.changeBoundingBoxColor(new THREE.Color( 7,0,0 ) );
                box.changeBoundingBoxColor(hover_color.clone());
            }
        }
    }
}






var camera_angle;
// controller for adding box
function onDocumentMouseUp( event ) {
    event.preventDefault();
    if (isRecording) {
        mouseDown = false;
        if (newBox != null && newBox.added) {
            addBox(newBox);
            evaluator.increment_add_box_count();
        }
        newBox = null;
        if (isResizing) {
            evaluator.increment_resize_count();
        }
        if (isMoving && selectedBox) {
            evaluator.increment_translate_count();
        }
        if (isRotating) {
            evaluator.increment_rotate_count();
        }
        isResizing = false;
        isRotating = false;
        // if (isMoving) {
        //     changeBoundingBoxColor(hoverBoxes[0], new THREE.Color( 7,0,0 ));
        // }
        isMoving = false;


        if (move2D) {
            evaluator.increment_rotate_camera_count(camera.rotation.z);
        }
    }
}

function onDocumentMouseDown( event ) {

    event.preventDefault();
    // if (move2D) {
    //     console.log(camera.rotation.z);
    //     grid.rotation.y = camera.rotation.z;
    // }
    if (isRecording) {
        if (!controls.enabled) {
            mouseDown = true;
            anchor = get3DCoord();
            var intersection = intersectWithCorner();
            // console.log("intersection: ", intersection);
            // update hover box
            if (selectedBox && (hoverBoxes.length == 0 || hoverBoxes[0] != selectedBox)) {
                selectedBox.changeBoundingBoxColor(0xffff00);
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
                hoverBoxes[0].select(get3DCoord());
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
    update_footer(getCurrentPosition());
}

function update_footer(pos) {
    var reminder_text = "";
    if (isRecording) {
        if (move2D) {
            if (controls.enabled == true) {
                reminder_text = "Hold control key and click on point cloud to start drawing bounding box";
            } else {
                if (isResizing) {
                    reminder_text = "Release mouse to stop resizing box";
                } else if (isMoving) {
                    reminder_text = "Release mouse to stop translating box";
                } else if (isRotating) {
                    reminder_text = "Release mouse to stop rotating box";
                } else if (mouseDown) {
                    reminder_text = "Release mouse to stop drawing box";
                } else {
                    reminder_text = "Click on point cloud to start drawing bounding box"
                }
            }
        }
    } else {
        reminder_text = "Resume recording to continue annotating";
    }
    
    $("#draw_bounding_box_reminder").find("p").text(reminder_text);
    // console.log(reminder_text);

    
    var x = pos.z;
    var y = pos.x;

    $("#footer").find("p").text("x: " + x + "\ny: " + y);
}

function show() {
    var rotation = 0;

    if (pointcloud !== undefined) {
        scene.remove(pointcloud);
        rotation = pointcloud.rotation.y;
        pointcloud = null;
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
    assertRecordMode();
    if (isRecording) {
        controls.enabled = true;
        move2D = false;
        // document.getElementById( 'label' ).className = "";
        document.getElementById( 'move2D' ).className = "";
        document.getElementById( 'move' ).className = "selected";
        controls.maxPolarAngle = 2 * Math.PI;
        controls.minPolarAngle = -2 * Math.PI;
        unprojectFromXZ();



        evaluator.resume_3D_time();
    }
}

function assertRecordMode() {
    if (!isRecording) {
        alert("Resume recording to change modes");
    }
}
function select2DMode() {
    document.getElementById( 'move' ).className = "";
    document.getElementById( 'move2D' ).className = "selected";
    camera.position.set(0, 100, 0);
    camera.lookAt(new THREE.Vector3(0,0,0));
    // camera.rotation.y = 0;
    controls.maxPolarAngle = 0;
    controls.minPolarAngle = 0;
    camera.updateProjectionMatrix();
    projectOntoXZ();

    controls.reset();
    controls.enabled = true;
    controls.update();
    move2D = true;
}

function move2DMode( event ) {
    event.preventDefault();
    if (isRecording) {
        document.getElementById( 'move' ).className = "";
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


            evaluator.pause_3D_time();
        }
        controls.enabled = true;
        controls.update();
        move2D = true;
    }
    
}

function projectOntoXZ() {
    var count = 0;
    for (var i = 0; i < pointcloud.geometry.vertices.length; i++) {
        var v = pointcloud.geometry.vertices[i];

        if (colors[i].b > colors[i].r) {
            count += 1;
            v.y = -0.000001;
        } else {
            v.y = 0;
        }

        // v.y = 0;
    }
    console.log(count);
    pointcloud.geometry.verticesNeedUpdate = true;
}

function unprojectFromXZ() {
    for (var i = 0; i < pointcloud.geometry.vertices.length; i++) {
        var v = pointcloud.geometry.vertices[i];
        v.y = yCoords[i];
    }
    pointcloud.geometry.verticesNeedUpdate = true;
}

var maxSize = 2;
var SettingsControls = function() {
                       this.size = pointSize / maxSize;
                };


var gui = new dat.GUI();
var settingsControls = new SettingsControls();
var settingsFolder = gui.addFolder('settings');
var size_slider = settingsFolder.add(settingsControls, 'size').min(0.0).max(1.0).step(0.05).onChange(function() {
    pointcloud.material.size = settingsControls.size * maxSize;
    pointMaterial.size = 4 * settingsControls.size * maxSize;
});

settingsFolder.open();

function reset() {
    // if (grid) {
    //     scene.remove(grid);
    //     scene.remove(pointcloud);
    // 

    if (boundingBoxes) {
        for (var i = 0; i < boundingBoxes.length; i++) {
            box = boundingBoxes[i];
            scene.remove(box.boxHelper);
            scene.remove(box.points);
            clearTable();
        }
        boundingBoxes = [];
        yCoords = null;
        yCoords = [];
    }
    evaluator = new Evaluator(camera.rotation.z, boundingBoxes, evaluation.get_filename());
}

function clearTable() {
    for (var i = 0; i < boundingBoxes.length; i++) {
            box = boundingBoxes[i];
            deleteRow(box.id);
        }
    id = 0;
}


