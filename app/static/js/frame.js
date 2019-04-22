function Frame(fname, data) {
	this.fname = fname;
	// this.pointcloud = null;
	this.data = data;
	this.bounding_boxes = [];
	this.ys = [];
	this.evaluator = new Evaluator();
	this.annotated = false;
	this.mask_rcnn_indices = [];

	var k = 0;
    for ( var i = 0, l = this.data.length / DATA_STRIDE; i < l; i ++ ) {
  
        this.ys.push(this.data[ DATA_STRIDE * k + 2 ]);
        
        k++;
    }

	this.output = function() {
		return new OutputFrame(this);
	};

	this.scene_add_frame_children = function() {
		for (var i = 0; i < this.bounding_boxes.length; i++) {
				var box = this.bounding_boxes[i];
				scene.add(box.points);
            	scene.add(box.boxHelper);
            	box.changeBoundingBoxColor(default_color);
            	container.appendChild(box.text_label.element);
			}
	};

	this.scene_add_frame_bounding_box = function() {
		for (var i = 0; i < this.bounding_boxes.length; i++) {
			var box = this.bounding_boxes[i];
        	scene.add(box.boxHelper);
        	box.changeBoundingBoxColor(COLOR_WHITE);
        	if (box.text_label) {
        		container.appendChild(box.text_label.element);
        	}
		}
	};

	this.scene_remove_frame_children = function() {
		for (var i = 0; i < this.bounding_boxes.length; i++) {
				var box = this.bounding_boxes[i];
				scene.remove(box.points);
            	scene.remove(box.boxHelper);
            	box.text_label.element.remove();
			}
	};

	this.is_annotated = function() {
		return this.bounding_boxes.length > 0;
	};

}

function OutputFrame(frame) {
	this.fname = frame.fname;
	this.bounding_boxes = [];
	// this.evaluator = new OutputEvaluator(frame.evaluator);

	for (var i = 0; i < frame.bounding_boxes.length; i++) {
		this.bounding_boxes.push(frame.bounding_boxes[i].output());
	}
}
	
