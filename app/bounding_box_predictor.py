import numpy as np
from scipy.spatial import cKDTree
from bounding_box import BoundingBox
from os.path import join, isfile
from os import listdir

class BoundingBoxPredictor():
	def __init__(self):
		self.n_segs = (1,1)
		self.n_iter=5
		self.n_lpr=500
		self.th_seeds=.4
		self.th_dist=.2

	def corners_to_bounding_box(self, corners):
		sorted_corners = sorted(corners, key=lambda x:x[1])
		if sorted_corners[2][0] > sorted_corners[3][0]:
			sorted_corners[2], sorted_corners[3] = sorted_corners[3], sorted_corners[2]
		if sorted_corners[0][0] > sorted_corners[1][0]:
			sorted_corners[0], sorted_corners[1] = sorted_corners[1], sorted_corners[0]

		top_right_corner = sorted_corners[3]
		top_left_corner = sorted_corners[2]
		bottom_left_corner = sorted_corners[0]

		center = np.mean(np.vstack((top_right_corner, bottom_left_corner)), axis=0)
		w = top_right_corner[0] - top_left_corner[0]
		l = top_left_corner[1] - bottom_left_corner[1]
		top_right_corner = top_right_corner - top_left_corner
		angle = np.arctan2(top_right_corner[1], top_right_corner[0])
		top_right_corner += top_left_corner

		bounding_box = {"center":center.tolist(), "angle":angle, "width":w, "length":l, 
						"corner1":top_right_corner.tolist(), "corner2":bottom_left_corner.tolist()}

		return bounding_box

	def predict_bounding_box(self, point, pc, num_seeds=5):
		# png = self.ground_plane_fitting(pc)["png"]
		assert len(pc.shape) == 2, "pointcloud must have 2-dimensional shape"
		print(pc.shape)
		png = pc
		if png.shape[1] == 4:
			png = png[:,:3]

		kd_tree = cKDTree(png)

		# Create random starting points for clustering algorithm
		std = .1
		seeds = np.random.randn(num_seeds-1, 3) * std + point
		seeds = np.vstack((point, seeds))

		dists, sample_indices = kd_tree.query(seeds)
		print("what")
		cluster_res = self.find_cluster(sample_indices, pc)
		print("cluster: ", cluster_res)
		edges, corners = self.search_rectangle_fit(cluster_res["cluster"], variance_criterion)
		return self.corners_to_bounding_box(corners)

	def find_cluster(self, sample_indices, pc, th_dist=1, num_nn=8, num_samples=5, overlap_thresh=.9):
	    kd_tree = cKDTree(pc)
	    clusters = []
	    seen_indices = []
	    for idx in sample_indices[:num_samples]:
	        cluster = []
	        queue = []
	        seen = set()
	        seen.add(idx)
	        queue.append(idx)
	        while len(queue):
	            idx = queue.pop(0)
	            point = pc[idx]
	            cluster.append(point)
	            dists, nn_indices = kd_tree.query(point, num_nn)
	            for i in range(num_nn):
	                if nn_indices[i] not in seen and dists[i] < th_dist:
	                    seen.add(nn_indices[i])
	                    queue.append(nn_indices[i]) 
	            
	        clusters.append(np.vstack(cluster))
	        seen_indices.append(np.array(list(seen)))
	    
	    overlapping_clusters = []
	    for i in range(len(seen_indices)):
	        num_overlapping =  sum([len(np.intersect1d(seen_indices[i], seen_indices[j]))/len(seen_indices[i]) > overlap_thresh for j in range(len(seen_indices)) if j!=i])
	        overlapping_clusters.append(num_overlapping)
	    
	    largest_cluster = np.argmax(overlapping_clusters)
	    res = {"cluster": clusters[largest_cluster], "indices": seen_indices[largest_cluster]}
	    return res
            

	def ground_plane_fitting(self, pc):
	    x_max, x_min = np.max(pc[:,0]), np.min(pc[:,0])
	    y_max, y_min = np.max(pc[:,1]), np.min(pc[:,1])
	    seg_size_x = (x_max - x_min) / self.n_segs[0]
	    seg_size_y = (y_max - y_min) / self.n_segs[1]
	    res_pg = []
	    res_png = []
	    for i in range(self.n_segs[0]):
	        for j in range(self.n_segs[1]):
	            indices = np.intersect1d(np.intersect1d(np.where(pc[:,0] >= x_min + i*seg_size_x)[0], 
	                                                    np.where(pc[:,0] < x_min + (i+1)*seg_size_x)[0]),
	                                     np.intersect1d(np.where(pc[:,1] >= y_min + j*seg_size_y)[0], 
	                                                    np.where(pc[:,1] < y_min + (j+1)*seg_size_y)[0]))
	            if not len(indices):
	                continue
	#             print(len(indices))
	            seg = pc[indices]
	            pg = self.extract_initial_seeds(seg, self.n_lpr, self.th_seeds)
	            png = []
	            for _ in range(self.n_iter):
	                model = self.estimate_plane(pg)
	                pg, png = [], [np.zeros((1, 3))]
	                for p in seg:
	                    if model(p) < self.th_dist:
	                        pg.append(p)
	                    else:
	                        png.append(p)
	#                 print(len(pg), len(png))                    
	                pg, png = np.vstack(pg), np.vstack(png)
	                png = np.delete(png, 0, axis=0)
	            res_pg.append(pg)
	            res_png.append(png)
	    res_pg = np.vstack(list(filter(len, res_pg)))
	    res_png = np.vstack(list(filter(len, res_png)))
	    res = {"pg": pg, "png": png}
	    return res

	def extract_initial_seeds(self, pc, n_lpr, th_seeds):
	    seeds = []
	    psorted = np.sort(pc[:,2])
	    LPR = np.mean(psorted[:self.n_lpr])
	    for i in range(len(pc)):
	        if pc[i,2] < LPR + self.th_seeds:
	            seeds.append(pc[i])
	    return np.vstack(seeds)

	def estimate_plane(self, pg):
	    s_hat = np.mean(pg, axis=0)
	    cov = sum([np.outer(s - s_hat, s - s_hat) for s in pg])
	    u, s, vh = np.linalg.svd(cov, full_matrices=True)
	    n = vh[2]
	    d = -n @ s_hat
	    def model(p):
	        return abs((p - s_hat) @ n)
	    return model
	        
	def search_rectangle_fit(self, pc, criterion):
	    pc = pc[:,:2]
	    Q = dict()
	    delta = np.pi / 180
	    for theta in np.linspace(0, np.pi/2 - delta, 90):
	        e1 = np.array([np.cos(theta), np.sin(theta)])
	        e2 = np.array([-np.sin(theta), np.cos(theta)])
	        C1 = pc @ e1
	        C2 = pc @ e2
	        q = criterion(C1, C2)
	        Q[theta] = q
	    theta_star = max(Q.items(), key=lambda kv: kv[1])[0]
	    print(theta_star)
	    C1_star = pc @ np.array([np.cos(theta_star), np.sin(theta_star)])
	    C2_star = pc @ np.array([-np.sin(theta_star), np.cos(theta_star)])
	    
	    a1, b1, c1 = np.cos(theta_star), np.sin(theta_star), np.min(C1_star)
	    a2, b2, c2 = -np.sin(theta_star), np.cos(theta_star), np.min(C2_star)
	    a3, b3, c3 = np.cos(theta_star), np.sin(theta_star), np.max(C1_star)
	    a4, b4, c4 = -np.sin(theta_star), np.cos(theta_star), np.max(C2_star)

	    v1 = line_intersection(a1, b1, c1, a2, b2, c2)
	    v2 = line_intersection(a2, b2, c2, a3, b3, c3)
	    v3 = line_intersection(a3, b3, c3, a4, b4, c4)
	    v4 = line_intersection(a1, b1, c1, a4, b4, c4)
	    return [(a1, b1, c1), (a2, b2, c2), 
	            (a3, b3, c3), (a4, b4, c4)], np.vstack([v1, v2, v3, v4])

def line_intersection(a1, b1, c1, a2, b2, c2):
    x = (c1*b2 - c2*b1) / (a1*b2 - a2*b1)
    y = (c1*a2 - c2*a1) / (b1*a2 - b2*a1)
    return np.array([x, y])

	    
def variance_criterion(C1, C2):
    c1_max, c1_min = np.max(C1), np.min(C1)
    c2_max, c2_min = np.max(C2), np.min(C2)
    D1 = np.argmin([np.linalg.norm(c1_max - C1), np.linalg.norm(C1 - c1_min)])
    D2 = np.argmin([np.linalg.norm(c2_max - C2), np.linalg.norm(C2 - c2_min)])
    D1 = [c1_max - C1, C1 - c1_min][D1]
    D2 = [c2_max - C2, C2 - c2_min][D2]
    E1 = D1[np.where(D1 < D2)[0]]
    E2 = D2[np.where(D2 < D1)[0]]
    gamma = -np.var(E1) - np.var(E2)
    return gamma

def closeness_criterion(C1, C2, d=1e-4):
    c1_max, c1_min = np.max(C1), np.min(C1)
    c2_max, c2_min = np.max(C2), np.min(C2)
    D1 = np.argmin([np.linalg.norm(c1_max - C1), np.linalg.norm(C1 - c1_min)])
    D2 = np.argmin([np.linalg.norm(c2_max - C2), np.linalg.norm(C2 - c2_min)])
    D1 = [c1_max - C1, C1 - c1_min][D1]
    D2 = [c2_max - C2, C2 - c2_min][D2]
    beta = 0
    for i in range(len(D1)):
        d = max(min(D1[i], D2[i]), d)
        beta += 1/d
    return beta

if __name__ == '__main__':
	DATA_DIR = 'input/bin_data'
	OUT_DIR = 'input/ground_removed'
	bin_data  = sorted([f for f in listdir(DATA_DIR) 
						if isfile(join(DATA_DIR, f)) and '.bin' in f])

	frame_names = [f.split(".")[0] for f in bin_data]
	print(frame_names)
	bp = BoundingBoxPredictor()

	for fname in frame_names:
		read_filename = join(DATA_DIR, fname.split(".")[0] + ".bin")
		data = np.fromfile(read_filename, dtype=np.float32)
		data = data.reshape((-1,4))[:,:3]
		print('input shape: {}'.format(data.shape))
		output = bp.ground_plane_fitting(data)['png']
		output = np.hstack((output, np.zeros((len(output), 1))))
		print('output shape: {}'.format(output.shape))
		save_filename = join(OUT_DIR, fname.split(".")[0] + ".bin")
		output.astype(np.float32).tofile(save_filename)





