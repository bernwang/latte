/* Class for handling file reading/writing, bounding box drawing */
function App() {
	this.fnames = [];
	this.frames = {};
	this.cur_frame;
	this.cur_pointcloud;
	this.move2D = false;
	this.eps = 0.00001;
	this.show_prev_frame;


	this.init = function() {
		$.ajax({
			context: this,
	        url: '/loadFrameNames',
	        type: 'POST',
	        contentType: 'application/json;charset=UTF-8',
	        success: function(response) {
	            this.fnames = response.split(',');
	            for (var i = 0; i < app.fnames.length; i++) {
	            	var fname = this.fnames[i];
	            	addFrameRow(fname);
	            	
	            }
	            this.set_frame(this.fnames[0]);
	            focus_frame_row(getFrameRow(this.fnames[0]));
	        },
	        error: function(error) {
	            console.log(error);
	        }
	    });
	};

	this.get_frame = function(fname) {
		if (fname in this.frames) {
			return this.frames[fname];
		} else {
			return false;
		}
	};

	this.set_frame = function(fname) {
		var frame = this.get_frame(fname);
		if (this.cur_frame == frame) {
			return;
		} 
		if (this.cur_frame) {
			this.write_frame_out();
			this.cur_frame.scene_remove_frame_children();	
			this.show_prev_frame = false;	
		}
		if (frame) {
			show(frame);
		} else {
			$.ajax({
		    	context: this,
		        url: '/getFramePointCloud',
		        data: JSON.stringify({fname: fname}),
		        type: 'POST',
		        contentType: 'application/json;charset=UTF-8',
		        success: function(response) {
		            var data = response.split(',').map(x => parseFloat(x));
		            var frame = new Frame(fname, data);
			        this.frames[fname] = frame;
					show(frame);
		        },
		        error: function(error) {
		            console.log(error);
		        }
		    });
		}
	};

	this.get_pointcloud_data = function(fname) {
		if (fname in this.frames) {
			return this.frames[fname].data;
		} else {
			var frame = this.get_frame(fname);
			return frame.data;
		}
	    
	};


	this.getCursor = function() {
		return get3DCoord();
	}

	// app.handleBoxAdd();
 //    app.handleBoxResize();
 //    app.handleLabelPrediction();


	this.handleBoxRotation = function() {
		if (mouseDown && isRotating) {
			rotatingBox.rotate(this.getCursor());
		}
	}

    this.handleBoxResize = function() {
    	if (!isResizing) {return;}
    	if (mouseDown) {
            var cursor = app.getCursor();
            // cursor's y coordinate nudged to make bounding box matrix invertible
            cursor.y -= this.eps;
            resizeBox.resize(cursor);
		} else {
			// evaluator.increment_resize_count();
            predictLabel(resizeBox);
            predictBox = resizeBox;
		}
    }

	this.handleBoxMove = function() {
		if (mouseDown && isMoving) {
    		selectedBox.translate(this.getCursor());
            selectedBox.changeBoundingBoxColor(selected_color.clone());
    	}
	}

	this.handleAutoDraw = function() {
		if (autoDrawMode) {
			$.ajax({
				context: this,
		        url: '/predictBoundingBox',
		        type: 'POST',
		        contentType: 'application/json;charset=UTF-8',
		        data: JSON.stringify({fname: this.cur_frame.fname, point: app.getCursor()}),
		        success: function(response) {
		            console.log(response);
		            var str = response.replace(/'/g, "\"");
		            // str = str.replace("\"", "'");
		            // str = str.replace(";", "\"");
		            console.log(str);
		            var res = JSON.parse(str);
	
		            var corner1 = new THREE.Vector3(res.corner1[1], this.eps, res.corner1[0]);
		            var corner2 = new THREE.Vector3(res.corner2[1], 0, res.corner2[0]);
		            console.log(corner1);
		            var box = createBox(corner1, 
		            					corner2, 
		            					res['angle']);
		            addBox(box);
		        },
		        error: function(error) {
		            console.log(error);
		        }
		    });
		}
	}

	this.get_prev_frame = function() {
		var cur_idx = this.fnames.indexOf(this.cur_frame.fname);
		if (cur_idx == 0 || !(this.fnames[cur_idx - 1] in this.frames)) {
			return null;
		}
		var prev_frame = this.frames[this.fnames[cur_idx - 1]];
		return prev_frame;
	}

	this.show_previous_frame_bounding_box = function() {
		var prev_frame = this.get_prev_frame();
		if (!prev_frame) {
			return;
		}
		console.log("show prev frame: ", this.show_prev_frame);
		if (!this.show_prev_frame) {
			this.show_prev_frame = true;
			prev_frame.scene_add_frame_bounding_box();
			
		} else if (this.show_prev_frame) {
			this.show_prev_frame = false;
			console.log("remove");
			prev_frame.scene_remove_frame_children();
		}
	}

	this.write_frame_out = function() {
		var output_frame = this.cur_frame.output();
		var output = {"frame": output_frame};
		var stringifiedOutput = JSON.stringify(output);
		$.ajax({
            url: '/writeOutput',
            data: JSON.stringify({output: {filename: this.cur_frame.fname, 
                                            file: stringifiedOutput}}),
            type: 'POST',
            contentType: 'application/json;charset=UTF-8',
            success: function(response) {
                console.log("successfully saved output")
            },
            error: function(error) {
                console.log(error);
            }
        });
	}

	this.render_text_labels = function() {
		if (app.cur_frame) {
	        for (var i = 0; i < app.cur_frame.bounding_boxes.length; i++) {
	            var box = app.cur_frame.bounding_boxes[i];
	            if (box.text_label) {
	                box.text_label.updatePosition();
	            }
	        }

	        if (app.show_prev_frame) {
	        	var prev_frame = this.get_prev_frame();
	        	if (!prev_frame) {
	        		return;
	        	}
	            for (var i = 0; i < prev_frame.bounding_boxes.length; i++) {
	                var box = prev_frame.bounding_boxes[i];
	                if (box.text_label) {
	                    box.text_label.updatePosition();
	                }
	            }
	        }
	    }
	}
}

function show(frame) {
    var initPointCloud;
    app.cur_frame = frame;
    if (app.cur_pointcloud == null) {
    	initPointCloud = true;
    }
    // add pointcloud to scene
    generatePointCloud();

    if (initPointCloud) {
    	scene.add( app.cur_pointcloud )
    	animate();
    }
    app.cur_frame.scene_add_frame_children();
}
