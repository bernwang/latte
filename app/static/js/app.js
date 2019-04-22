/* Class for handling file reading/writing, bounding box drawing */
function App() {
	this.fnames = [];
	this.frames = {};
	this.cur_frame;
	this.cur_pointcloud;
	this.move2D = false;
	this.eps = 0.00001;
	this.show_prev_frame;
	this.editing_box_id;
	this.evaluators = [];
	this.controls = {};
	this.lock_frame = false;

	this.init = function() {
		$.ajax({
			context: this,
			url: '/loadFrameNames',
			type: 'POST',
			contentType: 'application/json;charset=UTF-8',
			success: function(response) {
				this.drives = parsePythonJSON(response);
				var drive_keys = Object.keys(this.drives);
				drive_keys.sort();
				for (var i = 0; i < drive_keys.length; i++) {
					var drive = drive_keys[i];
					for (var j = 0; j < this.drives[drive].length; j++) {
						var fname = pathJoin([drive, this.drives[drive][j].split('.')[0]]);
						this.fnames.push(fname);
						addFrameRow(fname);
						this.controls[fname] = i;
					}
				}
				this.set_frame(this.fnames[0]);
				focus_frame_row(getFrameRow(this.fnames[0]));
			},
			error: function(error) {
				console.log(error);
			}
		});
	};

	this.get_prev_fname = function(fname) {
		var idx = this.fnames.indexOf(fname);
		if (idx == 0) {
			return ""
		}
		return this.fnames[idx-1];
	}

	this.get_frame = function(fname) {
		if (fname in this.frames) {
			return this.frames[fname];
		} else {
			return false;
		}
	};

	this.set_frame = function(fname) {
		var frame = this.get_frame(fname);
		// this.set_controls(fname);
		if (this.cur_frame == frame || this.lock_frame) {
			return;
		} 
		if (this.cur_frame) {
			this.write_frame_out();
			this.cur_frame.scene_remove_frame_children();	
			this.show_prev_frame = false;	
		}
		if (frame) {
			show(frame);
			this.predict_next_frame_bounding_box(this.get_prev_fname(fname));
		} else {
			$.ajax({
				context: this,
				url: '/getFramePointCloud',
				data: JSON.stringify({fname: fname}),
				type: 'POST',
				contentType: 'application/json;charset=UTF-8',
				success: function(response) {
					var data, res, annotation, bounding_boxes_json, bounding_boxes, box;
					res = response.split('?');
					data = res[0].split(',').map(x => parseFloat(x));
					var frame = new Frame(fname, data);

					if (res.length > 1 && res[1].length > 0)  {
						annotation = parsePythonJSON(res[1]);
						bounding_boxes_json = Object.values(annotation["frame"]["bounding_boxes"]);
						bounding_boxes = Box.parseJSON(bounding_boxes_json);
						for (var i = 0; i < bounding_boxes.length; i++) {
							box = bounding_boxes[i];
							frame.bounding_boxes.push(box);
							box.add_text_label();
							frame.annotated = true;
						}
					}

					this.frames[fname] = frame;

					this.get_Mask_RCNN_Labels(fname);
					this.predict_next_frame_bounding_box(this.get_prev_fname(fname));
					show(frame);
				},
				error: function(error) {
					console.log(error);
				}
			});
		}
	};

	this.predict_next_frame_bounding_box = function(fname) {
		if (!enable_bounding_box_tracking) {
			return;
		}
		var cur_idx = this.fnames.indexOf(fname);
		console.log("cur idx: ", cur_idx);
		if (cur_idx < 0 ||
			cur_idx >= this.fnames.length - 1 ||
			this.frames[this.fnames[cur_idx+1]].is_annotated() ||
			!this.frames[this.fnames[cur_idx]] || 
			!this.frames[this.fnames[cur_idx]].is_annotated()) {
			// console.log("annotated: ", this.frames[fname].is_annotated());
			return;
		}
		if (this.fnames[cur_idx].split("/")[0] != this.fnames[cur_idx+1].split("/")[0]) {
			return;
		}

		console.log("app.predict_next_frame_bounding_box, current fname: ", fname);

		var next_frame = this.frames[this.fnames[cur_idx+1]];
		console.log(next_frame.is_annotated);
		
		if (!next_frame.annotated) {
			next_frame.annotated = true;
			$.ajax({
				context: this,
				url: '/predictNextFrameBoundingBoxes',
				data: JSON.stringify({fname: fname}),
				type: 'POST',
				contentType: 'application/json;charset=UTF-8',
				success: function(response) {
					var res = response.split("\'").join("\"");
					console.log(res);
					res = JSON.parse(res);
					console.log(res);
					for (var box_id in res) {
						if (res.hasOwnProperty(box_id)) {
							console.log(res[box_id]);
							var json_box = res[box_id];
							var corner1 = new THREE.Vector3(json_box.corner1[1], 
															this.eps, 
															json_box.corner1[0]);
							var corner2 = new THREE.Vector3(json_box.corner2[1], 
															0, 
															json_box.corner2[0]);
							var box = createAndDrawBox(corner1, 
											  corner2, 
											  json_box['angle']);
							addBox(box);
						}
					}
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

	this.handleBoxRotation = function() {
		if (mouseDown && isRotating) {
			rotatingBox.rotate(this.getCursor());
			rotatingBox.add_timestamp();
		}
	}

	this.handleBoxResize = function() {
		if (!isResizing) {return;}
		if (mouseDown) {
			var cursor = app.getCursor();
			// cursor's y coordinate nudged to make bounding box matrix invertible
			cursor.y -= this.eps;
			resizeBox.resize(cursor);
			resizeBox.add_timestamp();
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
			selectedBox.add_timestamp();
		}
	}

	this.handleAutoDraw = function() {
		if (autoDrawMode && enable_one_click_annotation) {
			$.ajax({
				context: this,
				url: '/predictBoundingBox',
				type: 'POST',
				contentType: 'application/json;charset=UTF-8',
				data: JSON.stringify({fname: this.cur_frame.fname, point: app.getCursor()}),
				success: function(response) {
					console.log(response);
					var str = response.replace(/'/g, "\"");
					var res = JSON.parse(str);
	
					var corner1 = new THREE.Vector3(res.corner1[1], this.eps, res.corner1[0]);
					var corner2 = new THREE.Vector3(res.corner2[1], 0, res.corner2[0]);
					console.log(corner1);
					var box = createAndDrawBox(corner1, 
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
		if (this.cur_frame) {
			this.cur_frame.evaluator.pause_recording();
			var output_frame = this.cur_frame.output();
			console.log(output_frame);
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

	this.generate_new_box_id = function() {
		if (app.cur_frame) {
			var box_ids = [];
			for (var i = 0; i < app.cur_frame.bounding_boxes.length; i++) {
				box_ids.push(app.cur_frame.bounding_boxes[i].id);
			}
			if (box_ids.length > 0) {
				return Math.max.apply(Math, box_ids) + 1;
			}
		}
		return 0;
	}

	this.get_Mask_RCNN_Labels = function(fname) {
		console.log(enable_mask_rcnn, this.frames[fname].mask_rcnn_indices.length > 0);
	if (!enable_mask_rcnn || this.frames[fname].mask_rcnn_indices.length > 0) {return;}
		this.lock_frame = true;
		$.ajax({
			context: this, 
			url: '/getMaskRCNNLabels',
			data: JSON.stringify({fname: fname}),
			type: 'POST',
			contentType: 'application/json;charset=UTF-8',
			success: function(response) {
				var l = response.length - 1;
				maskRCNNIndices = response.substring(1, l).split(',').map(Number);
				// console.log(maskRCNNIndices);
				// console.log(response);
				this.frames[fname].mask_rcnn_indices = maskRCNNIndices;
				highlightPoints(maskRCNNIndices);
				updateMaskRCNNImagePanel();
				this.lock_frame = false;
			},
			error: function(error) {
				console.log(error);
				this.lock_frame = false;
			}
		});
	}

	this.pause_3D_time = function() {
		if (this.cur_frame && isRecording) {
			this.cur_frame.evaluator.pause_3D_time();
		}
	}
	this.increment_label_count = function() {
		if (this.cur_frame && isRecording) {
			this.cur_frame.evaluator.increment_label_count();
		}
	}

	this.decrement_label_count = function() {
		if (this.cur_frame && isRecording) {
			this.cur_frame.evaluator.decrement_label_count();
		}
	}

	this.increment_add_box_count = function() {
		if (this.cur_frame && isRecording) {
			this.cur_frame.evaluator.increment_add_box_count();
		}
	}

	this.increment_translate_count = function() {
		if (this.cur_frame && isRecording) {
			this.cur_frame.evaluator.increment_translate_count();
		}
	}

	this.increment_rotate_count = function() {
		if (this.cur_frame && isRecording) {
			this.cur_frame.evaluator.increment_rotate_count();
		}
	}

	this.increment_rotate_camera_count = function() {
		if (this.cur_frame && isRecording) {
			this.cur_frame.evaluator.increment_rotate_camera_count(camera.rotation.z);
		}
	}

	this.increment_resize_count = function() {
		if (this.cur_frame && isRecording) {
			this.cur_frame.evaluator.increment_resize_count(camera.rotation.z);
		}
	}

	this.increment_delete_count = function() {
		if (this.cur_frame && isRecording) {
			this.cur_frame.evaluator.increment_delete_count();
		}
	}

	this.resume_3D_time = function() {
		if (this.cur_frame && isRecording) {
			this.cur_frame.evaluator.resume_3D_time();
		}
	}

	this.pause_recording = function() {
		if (this.cur_frame && isRecording) {
			this.cur_frame.evaluator.pause_recording();
		}
	}

	this.resume_recording = function() {
		if (this.cur_frame && isRecording) {
			this.cur_frame.evaluator.resume_recording();
		}
	}

	this.set_controls = function(fname) {
		var i = this.controls[fname];
		console.log("asdf, ", i);
		if (i == 0) {
			enable_predict_label = false;
			enable_mask_rcnn = false;
			enable_one_click_annotation = false;
			enable_bounding_box_tracking = false;
		} else if (i == 1) {
			enable_predict_label = true;
			enable_mask_rcnn = true;
			enable_one_click_annotation = false;
			enable_bounding_box_tracking = false;
		} else if (i == 2) {
			enable_predict_label = false;
			enable_mask_rcnn = false;
			enable_one_click_annotation = true;
			enable_bounding_box_tracking = false;
		} else if (i == 3) {
			enable_predict_label = false;
			enable_mask_rcnn = false;
			enable_one_click_annotation = false;
			enable_bounding_box_tracking = true;
		} else if (i == 4) {
			enable_predict_label = true;
			enable_mask_rcnn = true;
			enable_one_click_annotation = true;
			enable_bounding_box_tracking = true;
		} else if (i == 5) {
			enable_predict_label = true;
			enable_mask_rcnn = true;
			enable_one_click_annotation = true;
			enable_bounding_box_tracking = true;
		}
	}

}

function parsePythonJSON(json) {
	return JSON.parse(json.split("\'").join("\""));
}

function show(frame) {
	var initPointCloud;

	if (app.cur_frame) {
		clearObjectTable();
	}
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
	loadObjectTable();
	switchMoveMode();

	// if (isRecording) {
	// 	toggleRecord(event);
	// }
}
