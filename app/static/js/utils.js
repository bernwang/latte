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

function getMaxElement(arr) {
    var max = Number.NEGATIVE_INFINITY;
    for (var i = 0; i< arr.length; i++) {
        if (arr[i] > max) {
            max = arr[i];
        }
    }
    return max;
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

function getOppositeCorner(idx) {
    if (idx == 0) {return 1;}
    if (idx == 1) {return 0;}
    if (idx == 2) {return 3;}
    return 2;
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
            distance2D(pos, b.geometry.vertices[i]) < b.get_cursor_distance_threshold()) {
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

function save(boundingBoxes) {
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
        reset();
        var file = x.files[0];
        load_text_file(file, import_annotations_from_bin);
        evaluator.resume_3D_time();
        evaluator.resume_time();
        $("#record").show();
        isRecording = true;
    }
}

var fileLoaded = true;
var currFile = "";
function upload_files() {
    var x = document.getElementById("file_input");
    if (x.files.length > 0) {
        for (var i = 0; i < x.files.length; i++) {
            var filename = x.files[i].name;
            var file = x.files[i];
            evaluation.add_filename(filename);
        }
        var text_reader = new FileReader();
        load_data_helper(0, x.files);
    }
}

function load_data_helper(index, files) {
    if (index < evaluation.filenames.length) {
        load_text_file(index, files[index], files);
    }
}


function import_annotations_from_bin(data) {
  if ( data === '' || typeof(data) === 'undefined') {
    return;
  }
}


function load_text_file(index, text_file, files) {
  if (text_file) {
    var text_reader = new FileReader();
    text_reader.readAsArrayBuffer(text_file);
    text_reader.onload = function() {
        readData(text_reader);
        load_data_helper(index + 1, files);
    }
  }
}

function readData(text_reader) {
    var rawLog = text_reader.result;
    var floatarr = new Float32Array(rawLog)
    evaluation.add_data(floatarr);
    if (evaluation.num_frames() == 1) { 
        reset();
        data = evaluation.get_data();
        // getMaskRCNNLabels(evaluation.get_filename());
        show();
        animate();
        // $.ajax({
        //     url: '/initTracker',
        //     data: JSON.stringify({pointcloud: pointcloud.geometry.vertices}),
        //     type: 'POST',
        //     contentType: 'application/json;charset=UTF-8',
        //     success: function(response) {
        //         console.log(response);
        //     },
        //     error: function(error) {
        //         console.log(error);
        //     }
        // });
        // evaluator.resume_3D_time();
        // evaluator.resume_time();
        $("#record").show();
        isRecording = false;
        $("#file_input").hide();
        select2DMode();
    }
}



// https://stackoverflow.com/a/15327425/4855984
String.prototype.format = function(){
    var a = this, b;
    for(b in arguments){
        a = a.replace(/%[a-z]/,arguments[b]);
    }
    return a; // Make chainable
};