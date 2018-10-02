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