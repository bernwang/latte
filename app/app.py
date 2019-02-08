from flask import Flask, render_template, request, jsonify
from bounding_box import BoundingBox
from pointcloud import PointCloud
from tracker import Tracker
import numpy as np
import json

app = Flask(__name__, static_url_path='/static')


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
	return str('Car')

if __name__ == "__main__":
	tracker = Tracker()
	app.run()
