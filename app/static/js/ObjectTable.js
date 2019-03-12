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
        "<tr><td class='id'><div class='object_row object_row_id'>{0}</td> \
        <td><div class='object_row'>{1}</div></td></tr>".format(box.id, options)
    );
    $("{0} tbody select".format(OBJECT_TABLE)).last().focus();
}

$(FRAMES_TABLE).on("mousedown", "tbody tr", function() {
    var frameId = $(this).find('.fname').text();
    app.set_frame(frameId);
    console.log("this: ", $(this));
    $("{0} tbody tr".format(FRAMES_TABLE)).each(
        function(idx, elem) {
            unfocus_frame_row(elem);
            console.log(idx);
        }
    );
    focus_frame_row($(this));
});

function focus_frame_row(frame) {
    $(frame).find(".fname").attr("selected", true);

}

function unfocus_frame_row(frame) {
    $(frame).find(".fname").attr("selected", false);
}


// $(OBJECT_TABLE).on("mousedown", ".object_row_id", function() {
//     $("{0} tbody tr".format(OBJECT_TABLE)).each(
//         function(idx, elem) {
//             unfocus_object_row(elem);
//             // console.log(idx);
//         }
//     );
//     focus_object_row($(this));
// });

function focus_object_row(frame) {
    $(frame).attr("selected", true);

}

function unfocus_object_row(frame) {
    console.log(frame);
    $(frame).attr("selected", false);
}

// handler that highlights input and corresponding bounding box when input is selected
$(OBJECT_TABLE).on('mousedown', '.object_row_id', function() {
    isMoving = false;
    var boxId = $(this).text();
    var box = getBoxById(boxId);
    selectRow(boxId);
    $("{0} .object_row_id".format(OBJECT_TABLE)).each(
        function(idx, elem) {
            unfocus_object_row(elem);
            // console.log(idx);
        }
    );
    box.select(null);
    selectedBox = box;
    focus_object_row($(this));
    });



// handler that saves input when input is changed
$("#object-table").on('change', 'tbody tr', updateObjectId);

// handler that is triggered when object table id is right-clicked
// $("#object-table").on('contextmenu', '.id', function() {
//     alert("hi");});


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

function getFrameRow(id) {
    var row = $("{0}".format(FRAMES_TABLE)).find('.fname').filter(function() {
        return $(this).text() == id.toString();}).closest("tr");
    console.log(row);
    return row;
}

// removes row of object id table given corrensponding bounding box id
function deleteRow(id) {
    var row = getRow(id);
    row.remove();
}

// gets box given its id
function getBoxById(id) {
    if (!app.cur_frame) return;
    var boundingBoxes = app.cur_frame.bounding_boxes;
    for (var i = 0; i < boundingBoxes.length; i++) {
        if (boundingBoxes[i].id == id) {
            return boundingBoxes[i];
        }
    }
}