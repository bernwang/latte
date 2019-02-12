from os import listdir
from os.path import isfile, join
import json

class FrameHandler():
	INPUT_BIN_DIR = "input/bin_data"
	OUTPUT_ANN_DIR = "output"
	INPUT_IMAGE_DIR = "input/image"

	def __init__(self):
		self.bin_data  = sorted([f for f in listdir(self.INPUT_BIN_DIR) if isfile(join(self.INPUT_BIN_DIR, f))])
		self.image_data  = sorted([f for f in listdir(self.INPUT_IMAGE_DIR) if isfile(join(self.INPUT_IMAGE_DIR, f))])
		self.frame_names = [f.split(".")[0] for f in self.bin_data]

	def get_frame_names(self):
		"""
		Get all the frame names
		"""
		return self.frame_names

	def save_annotation(self, fname, json_str):
		assert type(json_str) == str ,"json must be a string"
		try:
			json_object = json.loads(json_str)
		except ValueError:
			print("Annotation not a valid json")
			return
		fname = fname.split(".")[0] + ".json"
		save_filename = join(self.OUTPUT_ANN_DIR, fname)
		with open(save_filename, "w") as f:
			f.write(json)


