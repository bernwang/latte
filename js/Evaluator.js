function Evaluator(angle, bounding_boxes) {
	this.add_box_count = 0;
	this.resize_count = 0;
	this.translate_count = 0;
	this.rotate_count = 0;
	this.delete_count = 0;
	this.label_count = 0;
	this.rotate_camera_count = 0;
	this._3D_timer = new Timer();
	this.timer = new Timer();
	this.bounding_boxes = bounding_boxes;

	this.camera_angle = angle;

	this.increment_add_box_count = function() {
		this.add_box_count += 1;
	};

	this.increment_resize_count = function() {
		this.resize_count += 1;
	};

	this.increment_translate_count = function() {
		this.translate_count += 1;
	};

	this.increment_rotate_count = function() {
		this.rotate_count += 1;
	};

	this.increment_delete_count = function() {
		this.delete_count += 1;
	};

	this.increment_label_count = function() {
		this.label_count += 1;
	};

	this.increment_rotate_camera_count = function(angle) {
		if (angle != this.camera_angle) {
			this.rotate_camera_count += 1;
		}
		this.camera_angle = angle;
	}

	this.resume_3D_time = function() {
		this._3D_timer.resume();
	}

	this.pause_3D_time = function() {
		this._3D_timer.pause();
	}

	this.get_3D_time_elapsed = function() {
		return this._3D_timer.get_time_elapsed();
	}

	this.resume_time = function() {
		this.timer.resume();
	}

	this.pause_time = function() {
		this.timer.pause();
	}

	this.get_time_elapsed = function() {
		return this.timer.get_time_elapsed();
	}

	this.pause_recording = function() {
		this.pause_time();
		if (!move2D) {
			this.pause_3D_time();
		}
		
	}

	this.resume_recording = function() {
		this.resume_time();
		if (!move2D) {
			this.resume_3D_time();
		}
	}

}

function Timer() {
	this.time_elapsed = 0;
	this.date = new Date();
	this.running = false;

	this.resume = function() {
		this.date = new Date();
		this.running = true;
	}

	this.pause = function() {
		current_time = new Date();
		this.time_elapsed += current_time.getTime() - this.date.getTime();
		this.state = current_time;
		this.running = false;
	}

	this.get_time_elapsed = function() {
		if (this.running) {
			this.pause();
			this.resume();
		}
		return this.time_elapsed / 1000;
	}
}