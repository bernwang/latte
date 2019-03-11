var maxSize = 4;
var pointSize = 2;

var SettingsControls = function() {
                       this.size = pointSize / maxSize;
                };


var gui = new dat.GUI();
var settingsControls = new SettingsControls();
var settingsFolder = gui.addFolder('settings');
settingsFolder.add(settingsControls, 'size').min(0.0).max(1.0).step(0.05).onChange(function() {
    app.cur_pointcloud.material.size = settingsControls.size * maxSize;
    pointMaterial.size = 4 * settingsControls.size * maxSize;
});

settingsFolder.open();

function next_frame(event) {
    if (evaluation.is_done()) {
        alert("You have completed the evaluation! Thank you for participating!");
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
        animate();

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
function onKeyDown2(event) {
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

            case 65: // a key
            autoDrawModeToggle(true);
            break;

            case 90: // z key
            showPreviousFrameBoundingBoxToggle(true);
            break;

            case 68:
            default:
            break;
        }
    }   
    
}

// controller for releasing hotkeys
function onKeyUp2(event) {
    if(isRecording) {
        var KeyID = event.keyCode;
        switch(KeyID)
        {
            case 65:
            autoDrawModeToggle(false);
          default:
          toggleControl(true);
          break;
        }
    }
}

function showPreviousFrameBoundingBoxToggle(b) {
    app.show_previous_frame_bounding_box();
}
function autoDrawModeToggle(b) {
    autoDrawMode = b;
}
// toggles between move2D and move3D
function toggleControl(b) {
    if (b) {
        controls.enabled = b;
        controls.update();
    } else {
        if (app.move2D) {
            controls.enabled = b;
            controls.update();
        }
    }
}

function updateMaskRCNNImagePanel() {
    $("#panel").empty();
    $("#panel").prepend('<img src="static/images/masked_image.jpg" />');
    $("#panel").find("img").attr({'src': "static/images/masked_image.jpg?foo=" + new Date().getTime()});
    $("#panel").slideDown( "slow" );
}

function updateCroppedImagePanel(child) {
    $("#panel2").empty();
    if (child == 'outside FOV') {
        $("#panel2").prepend("Bounding box is outside camera's FOV");
    } else {
        $("#panel2").prepend('<img src="static/images/cropped_image.jpg" />');
        $("#panel2").find("img").attr({'src': "static/images/cropped_image.jpg?foo=" + new Date().getTime()});
        $("#panel2").slideDown( "slow" );
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

function clearTable() {
    for (var i = 0; i < boundingBoxes.length; i++) {
            box = boundingBoxes[i];
            deleteRow(box.id);
        }
    id = 0;
}
