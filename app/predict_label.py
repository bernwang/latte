import os

CUR_DIR = os.path.dirname(os.path.realpath(__file__))
PARENT_DIR = os.path.abspath(os.path.join(CUR_DIR, os.pardir))
DATA_DIR = os.path.join(PARENT_DIR, "input")
IMAGE_DIR = os.path.join(DATA_DIR, "image")

def predict_label(json_data, filename):
	drivename, fname = filename.split("/")
	fname = fname.split(".")[0]
	bounding_box_path = os.path.join("classify/bounding_boxes", fname+'.json')
	bounding_box_filename = os.path.join(CUR_DIR, bounding_box_path)
	output_path = os.path.join(CUR_DIR, "classify/write_data.txt")
	image_filename = os.path.join(IMAGE_DIR, fname+'.png')
	try:
		open(bounding_box_filename, 'w').close()
	except Exception as e:
		pass
	with open(bounding_box_filename,'a') as f:
		f.write(json_data)
	os.system("python3 {} --image_file={}".format(os.path.join(CUR_DIR, "classify/classifier.py"), image_filename))
	data = os.popen("cat {}".format(output_path)).read()
	os.system("rm classify/bounding_boxes/*.json")
	return get_keyword(data)


def get_keyword(data):
	pedestrian_keywords = {'person', 'man', 'woman', 'walker', 'pedestrian'}
	car_keywords = {'car'}
	van_keywords = {'van', 'minivan', 'bus', 'minibus'}
	truck_keywords = {'truck'}
	cyclist_keywords = {'cyclist', 'motorcyclist', 'unicyclist', 'bicycle', 'motocycle', 
						'bike', 'motorbike', 'unicycle', 'monocycle', 'rickshaw'}

	words = []
	for w in data.split(','):
		words.extend(w.split(' '))
	words = set(words)
	if words.intersection(car_keywords):
		return 0
	if words.intersection(van_keywords):
		return 1
	if words.intersection(truck_keywords):
		return 2
	if words.intersection(pedestrian_keywords):
		return 3
	if words.intersection(cyclist_keywords):
		return 4
	return -1

