from os import listdir
from os.path import isfile, join
import json
import numpy as np
from models import Frame

class FrameHandler():
	INPUT_BIN_DIR = "input/bin_data"
	GROUND_REMOVED_DIR = "input/ground_removed"
	OUTPUT_ANN_DIR = "output"
	INPUT_IMAGE_DIR = "input/image"

	def __init__(self):
		self.bin_data  = sorted([f for f in listdir(self.INPUT_BIN_DIR) 
							if isfile(join(self.INPUT_BIN_DIR, f)) and '.bin' in f])
		self.image_data  = sorted([f for f in listdir(self.INPUT_IMAGE_DIR) 
							if isfile(join(self.INPUT_IMAGE_DIR, f))])
		self.frame_names = [f.split(".")[0] for f in self.bin_data]
		self.bin_data_ground_removed = {}

	def get_frame_names(self):
		"""
		Get all the frame names
		"""
		return ",".join(self.frame_names)

	def get_all_pointclouds(self):
		return "\n".join([self.get_pointcloud(x) for x in self.bin_data])

	def get_pointcloud(self, fname, dtype=str, ground_removed=False):
		"""
		Gets point cloud as list of floats

		Input:
		- fname: Frame name. Can have file extension. 

		Returns a string of comma-separated floats. The number of floats 
		is 4N, where N is the number of points in the point cloud. 
		Each point is represented by 4 numbers - the x, y, z coordinates 
		as well as the intensity.
		"""
		filename = join(self.INPUT_BIN_DIR, fname.split(".")[0] + ".bin")
		data = np.fromfile(filename, dtype=np.float32)
		if ground_removed:
			filename = join(self.GROUND_REMOVED_DIR, fname.split(".")[0] + ".bin")
			data = np.fromfile(filename, dtype=np.float32)	
		if dtype == str:
			data = data.flatten(order="C").tolist()
			data_str = (",").join([str(x) for x in data])
			return data_str
		else:
			if ground_removed:
				return data.reshape((-1,4))
			else:
				return data.reshape((-1,4))[:,:3]

	def load_annotation(self, fname, dtype='object'):
		fname = fname.split('.')[0] + '.json'
		try:
			with open(join(self.OUTPUT_ANN_DIR, fname), "r") as read_file:
				print("file: ", read_file)
				try:
					frame = json.load(read_file)
					if dtype == 'object':
						return Frame.parse_json(frame)
					else:
						return frame
				except json.JSONDecodeError:
					return ""
		except:
			return ""


	def save_annotation(self, fname, json_str):
		"""
		Saves json string to output directory. 

		Inputs:
		- fname: Frame name. Can have file extension. 
		- json_str: String in json to be saved

		Returns 1 if successful, 0 otherwise
		"""
		assert type(json_str) == str, "json must be a string"
		try:
			json_object = json.loads(json_str)
		except ValueError:
			print("Annotation not a valid json")
			return 0
		fname = fname.split(".")[0] + ".json"
		save_filename = join(self.OUTPUT_ANN_DIR, fname)
		with open(save_filename, "w") as f:
			f.write(json_str)
			return 1
		return 0


