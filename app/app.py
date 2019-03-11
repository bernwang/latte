from flask import Flask, render_template, request, jsonify
from bounding_box import BoundingBox
from pointcloud import PointCloud
from tracker import Tracker
from predict_label import predict_label
from mask_rcnn import get_mask_rcnn_labels
from frame_handler import FrameHandler
from bounding_box_predictor import BoundingBoxPredictor
import numpy as np
import json
import os
from pathlib import Path

app = Flask(__name__, static_url_path='/static')
DIR_PATH = os.path.dirname(os.path.realpath(__file__))

@app.route("/")
def root():
	return render_template("index.html")

@app.route("/initTracker", methods=["POST"])
def init_tracker():
	json_request = request.get_json()
	pointcloud = PointCloud.parse_json(json_request["pointcloud"])
	tracker = Tracker(pointcloud)
	print(str(tracker))
	return "success"

@app.route("/trackBoundingBoxes", methods=['POST'])
def trackBoundingBox():
	json_request = request.get_json()
	pointcloud = PointCloud.parse_json(json_request["pointcloud"], json_request["intensities"])
	filtered_indices = tracker.filter_pointcloud(pointcloud)
	next_bounding_boxes = tracker.predict_bounding_boxes(pointcloud)
	# print(filtered_indices)
	print(next_bounding_boxes)
	return str([filtered_indices, next_bounding_boxes])


@app.route("/updateBoundingBoxes", methods=['POST'])
def updateBoundingBoxes():
	print(request.get_json())
	json_request = request.get_json()
	bounding_boxes = BoundingBox.parse_json(json_request["bounding_boxes"])
	tracker.set_bounding_boxes(bounding_boxes)
	return str(bounding_boxes)


@app.route("/predictLabel", methods=['POST'])
def predictLabel():
	json_request = request.get_json()
	json_data = json.dumps(json_request)
	filename = json_request['filename'].split('.')[0]
	os.system("rm {}/*".format(os.path.join(DIR_PATH, "static/images")))
	predicted_label = predict_label(json_data, filename)
	in_fov = os.path.exists(os.path.join(DIR_PATH, "static/images/cropped_image.jpg"))
	print(os.path.join(DIR_PATH, "static/images/cropped_image.jpg"), in_fov, os.path.exists("/Users/berniewang/annotator/lidarAnnotator/app/static/images"))
	return ",".join([str(predicted_label), str(in_fov)])


@app.route("/getMaskRCNNLabels", methods=['POST'])
def getMaskRCNNLabels():
	filename = request.get_json()['filename'].split('.')[0]
	print(filename)
	return str(get_mask_rcnn_labels(filename))


@app.route("/writeOutput", methods=['POST'])
def writeOutput():
	frame = request.get_json()['output']
	print(frame["filename"])
	fh.save_annotation(frame["filename"], frame["file"])
	return str("hi")


@app.route("/loadFrameNames", methods=['POST'])
def loadFrameNames():
	return fh.get_frame_names()

@app.route("/getFramePointCloud", methods=['POST'])
def getFramePointCloud():
	json_request = request.get_json()
	fname = json_request["fname"]
	data_str = fh.get_pointcloud(fname, dtype=str)
	# pc = fh.get_pointcloud(fname, dtype=float)
	# data = bp.ground_plane_fitting(pc)["png"]
	# fh.bin_data_ground_removed[fname] = data
	# data = np.hstack((data, np.zeros((len(data), 1))))
	# data = data.flatten(order="C").tolist()
	# data_str = (",").join([str(x) for x in data])
	return data_str

@app.route("/predictBoundingBox", methods=['POST'])
def predictBoundingBox():
	json_request = request.get_json()
	fname = json_request["fname"]
	point = json_request["point"]
	point = np.array([point['z'], point['x'], point['y']])
	print(point)
	frame = fh.get_pointcloud(fname, dtype=float, ground_removed=False)
	print("num points with ground: {}".format(frame.shape))
	frame = fh.get_pointcloud(fname, dtype=float, ground_removed=True)
	print("num points without ground: {}".format(frame.shape))
	return str(bp.predict_bounding_box(point, frame))

if __name__ == "__main__":
	tracker = Tracker()
	fh = FrameHandler()
	bp = BoundingBoxPredictor()
	# pf = ParticleFilter(N=500)
	os.system("rm {}/*".format(os.path.join(DIR_PATH, "static/images")))
	app.run()
