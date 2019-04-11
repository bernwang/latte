import numpy as np
import json
# import matplotlib.pyplot as plt
# from mpl_toolkits.mplot3d import Axes3D

class PointCloud():
	def __init__(self, points, intensities=[]):
		self.points = points
		self.intensities = intensities

	# @staticmethod
	# def parse_json(json_pointcloud):
	# 	points = np.vstack([np.array([json_pointcloud[i]["z"],
	# 								  json_pointcloud[i]["x"],
	# 								  json_pointcloud[i]["y"]]
	# 								)
	# 					   for i in range(len(json_pointcloud))])
		# return points

	@staticmethod
	def parse_json(json_pointcloud, json_intensities):
		intensities = np.array(json_intensities)
		points = np.vstack([np.array([json_pointcloud[i]["z"],
									  json_pointcloud[i]["x"]]
									)
						   for i in range(len(json_pointcloud))])
		print(len(intensities) - np.count_nonzero(intensities))
		# points = np.array([(json_pointcloud[i]["x"],
		# 		   json_pointcloud[i]["y"]) for i in range(len(json_pointcloud))])
		return PointCloud(points, intensities)

	def filter_points(self):
		mean = np.mean(self.intensities)
		std = np.std(self.intensities)
		filtered_indices = np.where(self.intensities > mean -  0 * std)[0]
		print("mean: ", np.mean(self.intensities), np.max(self.intensities), np.min(self.intensities), np.std(self.intensities))
		print(filtered_indices[:50], len(filtered_indices))
		print(self.intensities[:50], len(self.intensities))
		return PointCloud(self.points[filtered_indices,:], self.intensities[filtered_indices]) 

	def rigid_transform(self, theta, center):
		R = np.array([[np.cos(theta), np.sin(theta)], 
					  [-np.sin(theta), np.cos(theta)]])
		demeaned_points = self.points - center
		return demeaned_points.dot(R)