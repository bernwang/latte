var options = `<select>
    <option value="car">Car</option>
    <option value="van">Van</option>
    <option value="truck">Truck</option>
    <option value="pedestrian">Pedestrian</option>
    <option value="cyclist">Cyclist</option>
    <option value="sitter">Sitter</option>
    <option value="tram">Tram</option>
    <option value="misc">Misc</option>
    /select`;


// method to add row to object id table
function addFrameRow(fname) {
    $("{0} tbody".format(FRAMES_TABLE)).append(
        "<tr><td><div class='fname'>{0}</div></td></tr>".format(fname)
    );
}

// method to add row to object id table
function addObjectRow(box) {
    $("{0} tbody".format(OBJECT_TABLE)).append(
        "<tr><td class='id'>{0}</td><td>{1}</td></tr>".format(box.id, options)
    );
    $("{0} tbody select".format(OBJECT_TABLE)).last().focus();
}

$(FRAMES_TABLE).on("mousedown", "tbody tr", function() {
    var frameId = $(this).find('.fname').text();
    console.log(frameId);
    app.set_frame(frameId);
})

// handler that highlights input and corresponding bounding box when input is selected
$("#object-table").on('mousedown', 'tbody tr', function() {
    isMoving = false;
    var boxId = $(this).find('.id').text();
    var box = getBoxById(boxId);
    selectRow(boxId);
    box.select(null);
    selectedBox = box;
    var center = box.get_center();
    var current_angle = camera.rotation.z;
    console.log("current angle:", current_angle);
    // controls.target.set(center.x, 0, center.y);
    
    // controls.target.set(0, 0, 0);
    // camera.updateProjectionMatrix();
    // controls.update();
    
    // controls.update();
    // camera.rotation.z = current_angle;
    console.log("camera rotation: ", camera.rotation.z);
    // camera.lookAt(new THREE.Vector3(center.x,0,center.y));
    
    // controls.update();
    });



// handler that saves input when input is changed
$("#object-table").on('change', 'tbody tr', updateObjectId);

// method to update Box's object id
function updateObjectId() {    
    var boxId = $(this).find(".id").text();
    var input = $(this).find('select').val();
    var box = getBoxById(boxId);
    box.object_id = input;

    // evaluator.increment_label_count();
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
    $(row).find('select').get(0).focus();
}

// removes row of object id table given corrensponding bounding box id
function deleteRow(id) {
    var row = getRow(id);
    row.remove();
}

// gets box given its id
function getBoxById(id) {
    for (var i = 0; i < boundingBoxes.length; i++) {
        if (boundingBoxes[i].id == id) {
            return boundingBoxes[i];
        }
    }
}