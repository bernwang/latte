function Frame(fname, data) {
	this.fname = fname;
	// this.pointcloud = null;
	this.data = data;
	this.bounding_boxes = [];

	this.output = function() {
		return new OutputFrame(this);
	}

	this.scene_add_frame_children = function() {
		for (var i = 0; i < this.bounding_boxes.length; i++) {
				var box = this.bounding_boxes[i];
				scene.add(box.points);
            	scene.add(box.boxHelper);
            	box.changeBoundingBoxColor(default_color);
			}
	}

	this.scene_add_frame_bounding_box = function() {
		for (var i = 0; i < this.bounding_boxes.length; i++) {
			var box = this.bounding_boxes[i];
        	scene.add(box.boxHelper);
        	box.changeBoundingBoxColor(COLOR_WHITE);
		}
	}

	this.scene_remove_frame_children = function() {
		for (var i = 0; i < this.bounding_boxes.length; i++) {
				var box = this.bounding_boxes[i];
				scene.remove(box.points);
            	scene.remove(box.boxHelper);
			}
	}

}

function OutputFrame(frame) {
	this.fname = frame.fname;
	this.bounding_boxes = [];

	var output_evaluators = [];
		for (var i = 0; i < frame.bounding_boxes.length; i++) {
			this.bounding_boxes.push(frame.bounding_boxes[i].output());
		}
}
	
