import numpy as np

class BoundingBox():
	def __init__(self, center, width, length, angle, object_id):
		self.x = center['x']
		self.y = center['y']
		self.width = width
		self.length = length
		self.angle = angle
		self.object_id = object_id

	@staticmethod
	def parse_json(json):
		return [BoundingBox(json_obj['center'], 
							 json_obj['width'],
							 json_obj['length'],
							 json_obj['angle'],
							 json_obj['object_id'])
							  for json_obj in json]

	def filter_points(self, pointcloud, bounding_factor=.1):
		l, w, theta = self.length, self.width, self.angle
		center = np.array([[self.x, self.y]])
		rotated_points = pointcloud.rigid_transform(theta, center)
		x, y = rotated_points[:, 0], rotated_points[:, 1]
		indices_within_width = np.where(np.abs(x) <= w / 2 * (1 + bounding_factor))[0]
		indices_within_length = np.where(np.abs(y) <= l / 2 * (1 + bounding_factor))[0]

		bounded_indices = np.intersect1d(indices_within_width, indices_within_length)
		return bounded_indices


	# def filter_points2(self, pointcloud):
	# 	l, w, theta = self.length, self.width, self.angle
	# 	cx, cy = self.x, self.y
	# 	m = np.tan(theta)
	# 	if np.isclose(theta, np.pi / 2) or np.isclose(theta, np.pi * 3 / 2):
	# 		filter_fn = lambda point : (point[0] <= cx + bounding_factor * w and 
	# 									point[0] >= cx - bounding_factor * w)
	# 		# filter_fn_y = lambda point : (point[1] <= cy + bounding_factor * l and 
	# 		# 							  point[1] >= cy - bounding_factor * l)
	# 	else:
	# 		upper_x = cx + l / 2 * np.cos(theta) + w / 2 * np.cos(np.pi / 2 + theta)
	# 		upper_y = cy + l / 2 * np.sin(theta) + w / 2 * np.sin(np.pi / 2 + theta)
	# 		b_upper = upper_y - m * upper_x

	# 		lower_x = cx - l / 2 * np.cos(theta) - w / 2 * np.cos(np.pi / 2 + theta)
	# 		lower_y = cy - l / 2 * np.sin(theta) - w / 2 * np.sin(np.pi / 2 + theta)
	# 		b_lower = lower_y - m * lower_x

	# 		filter_fn = lambda point : (point[1] >= m * point[0] + b_lower - w * bounding_factor and 
	# 									point[1] <= m * point[0] + b_upper + w * bounding_factor)

	# 	filtered_pointcloud = filter(filter_fn, pointcloud.points)

	# 	return list(filtered_pointcloud)
