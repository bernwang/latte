import os
import sys
import numpy as np

def get_mask_rcnn_labels(filename):
	ROOT_DIR = os.path.dirname(os.path.realpath(__file__))
	os.system("python3 Mask_RCNN/mask_rcnn_demo.py --image_filename={}".format(filename))
	# bounded_indices = mask_rcnn_demo.main(filename)
	bounded_indices = np.fromfile(
					    os.path.join(ROOT_DIR, "Mask_RCNN/output/indices.bin"),
					    dtype=np.int)
	os.system("rm {}/Mask_RCNN/output/*.bin".format(ROOT_DIR))

	print(bounded_indices)
	return bounded_indices.tolist()
	# os.system("rm classify/bounding_boxes/*.json")