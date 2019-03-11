import os




def predict_label(json_data, filename):
	current_dir_path = os.path.dirname(os.path.realpath(__file__))
	bounding_box_path = os.path.join("classify/bounding_boxes", filename+'.json')
	bounding_box_filename = os.path.join(current_dir_path, bounding_box_path)
	output_path = os.path.join(current_dir_path, "classify/write_data.txt")
	image_filename = os.path.join("/Users/berniewang/annotator/lidarAnnotator/app/classify/data/image", filename+'.png')
	try:
		open(bounding_box_filename, 'w').close()
	except Exception as e:
		pass
	with open(bounding_box_filename,'a') as f:
		f.write(json_data)
	os.system("python {} --image_file={}".format(os.path.join(current_dir_path, "classify/classifier.py"), image_filename))
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

