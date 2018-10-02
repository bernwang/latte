import numpy as np
from pointcloud import PointCloud
import matplotlib.pyplot as plt
from scipy import signal
from mpl_toolkits.mplot3d import Axes3D

class Tracker():
	def __init__(self):
		self.bounding_boxes = []

	def set_bounding_boxes(self, bounding_boxes):
		self.bounding_boxes = bounding_boxes

	def predict_bounding_boxes(self, pointcloud, set_next_bounding_boxes=False, bounding_factor=.5, eps=0.1):
		next_bounding_boxes = []
		for bounding_box in self.bounding_boxes:
			filtered_pointcloud = pointcloud.filter_points()
			filtered_pointcloud_indices = bounding_box.filter_points(filtered_pointcloud, 
																	 bounding_factor=bounding_factor)
			filtered_points = filtered_pointcloud.points[filtered_pointcloud_indices,:]
			x, y = filtered_points[:,0], filtered_points[:,1]
			z = filtered_pointcloud.intensities[filtered_pointcloud_indices]

			# fig = plt.figure()
			# ax = fig.add_subplot(111, projection='3d')
			# ax.scatter(x, y, z)
			# plt.show()

			sorted_x, sorted_y = np.sort(x), np.sort(y)

			resolution = max(eps, min(np.min(np.ediff1d(sorted_x)), np.min(np.ediff1d(sorted_y))))
			h, w = int((np.max(x) - np.min(x)) // resolution) + 1, int((np.max(y) - np.min(y)) // resolution) + 1
			print(h, w, resolution)

			im = -np.ones((h, w)) * 5e-2
			quantized_x = ((filtered_points[:,0] - np.min(x)) // resolution).astype(int)
			quantized_y = ((filtered_points[:,1] - np.min(y)) // resolution).astype(int)
			im[quantized_x, quantized_y] = 1

			mask_h = int(bounding_box.width // resolution) + 1 
			mask_w = int(bounding_box.length // resolution) + 1

			mask = np.ones((mask_h, mask_w))


			# plt.scatter(x, y)
			# plt.show()


			print("mask shape: ", mask.shape)
			cc = signal.correlate2d(im, mask, mode="same")
			center = (np.array([np.argmax(cc) // w, np.argmax(cc) % w]) * resolution +
						np.array([np.min(x), np.min(y)]))
			upper_right = center + np.array([bounding_box.width / 2, bounding_box.length / 2])
			lower_left = center - np.array([bounding_box.width / 2, bounding_box.length / 2])
			theta = bounding_box.angle
			box_pointcloud = PointCloud(np.vstack((upper_right, lower_left)))
			corners = box_pointcloud.rigid_transform(theta, center) + center
			next_bounding_boxes.append([corners.tolist(), theta])
			print(np.argmax(cc) // w, np.argmax(cc) % w, np.argmax(cc), np.max(cc), cc[np.argmax(cc) // w, np.argmax(cc) % w])
			# plt.subplot(1,2,1)
			# plt.imshow(im, cmap='Greys',  interpolation='nearest')
			# plt.subplot(1,2,2)
			# plt.imshow(cc, cmap='Greys',  interpolation='nearest')
			
			
			# plt.show()
		return next_bounding_boxes

	def filter_pointcloud(self, pointcloud, bounding_factor=.1):
		filtered_pointcloud_indices = []
		for bounding_box in self.bounding_boxes:
			filtered_pointcloud_indices.extend(bounding_box.filter_points(pointcloud, 
											   bounding_factor=bounding_factor))

		return filtered_pointcloud_indices
