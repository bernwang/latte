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
		
