import matplotlib
matplotlib.use('TkAgg')
import numpy as np
from scipy.spatial import cKDTree
from models import BoundingBox, Frame
from os.path import join, isfile
from os import listdir
from oxt import load_oxts_lite_data, oxts2pose
from frame_handler import FrameHandler
from mpl_toolkits.mplot3d import Axes3D
import matplotlib.pyplot as plt
import time

class BoundingBoxPredictor():
    def __init__(self, frame_handler):
        self.n_segs = (1,1)
        self.n_iter=5
        self.n_lpr=500
        self.th_seeds=.4
        self.th_dist=.2

        self.frame_handler = frame_handler
        self.oxt_path = "oxts/"
        self.oxts = {drive: load_oxts_lite_data(join(FrameHandler.DATASET_DIR, drive), self.frame_handler.drives[drive]) 
                    for drive in self.frame_handler.drives.keys()}
        self.poses = {drive: oxts2pose(self.oxts[drive]) for drive in self.oxts.keys()}

    def transform_coords(self, fname, x, inv=False):
        if x.size == 2:
            x = np.append(x, [0, 1])
        if x.size == 3:
            x = np.append(x, [1])
        idx = self.frame_handler.frame_names.index(fname)
        transform = self.poses[idx]
        if inv:
            transform = np.linalg.inv(transform)

        return transform @ x

    def get_velocities(self, prev_frame, cur_frame, ref_fname):
        bounding_boxes = sorted(cur_frame.bounding_boxes, 
                                key=lambda box: box.box_id)
        velocities = {}
        prev_frame_bounding_boxes = {box.box_id:box for box in prev_frame.bounding_boxes}
        for i, box in enumerate(bounding_boxes):
            box_id = box.box_id
            print(box_id)
            cur_center = box.center

            if box_id in prev_frame_bounding_boxes:
                prev_center = prev_frame_bounding_boxes[box_id].center
                cur_center_corr = self.transform_coords(cur_frame.fname, cur_center)
                prev_center_corr = self.transform_coords(prev_frame.fname, prev_center)
                velocities[box_id] = self.transform_coords(ref_fname, 
                                                           cur_center - prev_center,
                                                           inv=True)[:2]

        return velocities

    def predict_next_frame_bounding_boxes(self, frame):
        drivename, fname = frame.fname.split('.')[0].split("/")
        print(self.frame_handler.drives[drivename])
        idx = self.frame_handler.drives[drivename].index(fname)
        next_fname = self.frame_handler.drives[drivename][idx+1]

        pc = self.frame_handler.get_pointcloud(drivename, fname, dtype=float, ground_removed=True)
        next_pc = self.frame_handler.get_pointcloud(drivename, next_fname, dtype=float, ground_removed=True)
        print(fname)
        print([box.box_id for box in frame.bounding_boxes])
        bounding_boxes = sorted(frame.bounding_boxes, 
                            key=lambda box:box.box_id)
        centers = {box.box_id:box.center for box in bounding_boxes}
        velocities = {box_id:np.zeros(2) for box_id in centers.keys()}
        
        next_pc[:,2] = 0
        next_pc = next_pc[:,:3]
        np.random.shuffle(next_pc)
        next_pc_small = next_pc[::4]
        next_bounding_boxes = {}
        for bounding_box in bounding_boxes:
            try:
                next_bounding_boxes[str(bounding_box.box_id)] = self._predict_next_frame_bounding_box(bounding_box, next_pc_small) 
            except:
                pass

        # next_bounding_boxes = {str(bounding_box.box_id):self._predict_next_frame_bounding_box(bounding_box, next_pc_small) 
        #                         for bounding_box in bounding_boxes}
        return next_bounding_boxes

    def _predict_next_frame_bounding_box(self, bounding_box, pc):
        start = time.time()
        without_cluster, cluster = bounding_box.filter_pointcloud(pc)
        np.random.shuffle(cluster)
        sample_indices = []


        kd_tree = cKDTree(pc)
        # for point in cluster:
        #     dists, nn_indices = kd_tree.query(point, 1)
        #     sample_indices.append(nn_indices)
        point = np.mean(cluster, axis=0)

        #trim png
        dists, ii = kd_tree.query(point, len(pc))
        cutoff_idx = np.where(dists < 6)[0][-1]
        pc_trimmed = pc[ii[:cutoff_idx]]
        np.random.shuffle(pc_trimmed)

        if pc_trimmed.shape[0] > 5000:
            pc_trimmed = pc_trimmed[::4]
        elif pc_trimmed.shape[0] > 2500:
            pc_trimmed = pc_trimmed[::2]

        pc_trimmed = pc_trimmed[::2]
        kd_tree = cKDTree(pc_trimmed)

        # Create random starting points for clustering algorithm
        # std = .3
        # seeds = np.random.randn(100, 3) * std + point
        # seeds = np.vstack((point, seeds))
        # seeds = kd_tree.query(point, 50)

        dists, sample_indices = kd_tree.query(point, 50)


        # cluster_res = self.find_cluster(sample_indices, pc_trimmed, th_dist=.4, num_nn=20, num_samples=20)
        # edges, corners = self.search_rectangle_fit(cluster_res['cluster'], variance_criterion)
        res = self.predict_bounding_box(point, pc, num_seeds=5, plot=False)
        print("time to predict bounding box: ", time.time() - start)
        # return self.corners_to_bounding_box(corners, context=bounding_box)
        return res

    def corners_to_bounding_box(self, corners, context=None):
        sorted_corners = sorted(corners, key=lambda x:x[1])
        if sorted_corners[2][0] > sorted_corners[3][0]:
            sorted_corners[2], sorted_corners[3] = sorted_corners[3], sorted_corners[2]
        if sorted_corners[0][0] > sorted_corners[1][0]:
            sorted_corners[0], sorted_corners[1] = sorted_corners[1], sorted_corners[0]

        top_right_corner = sorted_corners[3]
        top_left_corner = sorted_corners[2]
        bottom_left_corner = sorted_corners[0]
        bottom_right_corner = sorted_corners[1]

        center = np.mean(np.vstack((top_right_corner, bottom_left_corner)), axis=0)
        w = np.linalg.norm(top_right_corner - top_left_corner)
        l = np.linalg.norm(top_left_corner[1] - bottom_left_corner[1])

        if w < l:
            w, l = l, w
            top_left_corner, top_right_corner, bottom_right_corner, bottom_left_corner = top_right_corner, bottom_right_corner, bottom_left_corner, top_left_corner 

        top_right_corner = top_right_corner - top_left_corner
        angle = np.arctan2(top_right_corner[1], top_right_corner[0])
        top_right_corner += top_left_corner
        
        if context:
            candidate_angles = np.array([angle-np.pi, angle, angle+np.pi])
            prev_angle = context.angle
            angle = candidate_angles[np.argmin(np.abs(candidate_angles - prev_angle))]

        

        bounding_box = {"center":center.tolist(), "angle":angle, "width":w, "length":l, 
                        "corner1":top_right_corner.tolist(), "corner2":bottom_left_corner.tolist()}

        return bounding_box

    def predict_bounding_box(self, point, pc, num_seeds=5, plot=False):
        # png = self.ground_plane_fitting(pc)["png"]
        print("point: {}".format(point))
        assert len(pc.shape) == 2, "pointcloud must have 2-dimensional shape"
        png = pc
        if png.shape[1] == 4:
            png = png[:,:3]
        if point.size == 2:
            point = np.append(point, [0])
        if point.size == 4:
            point = point[:3]

        png[:,2] = 0
        kd_tree = cKDTree(png)
        print(len(png))

        #trim png
        dists, ii = kd_tree.query(point, len(png))
        cutoff_idx = np.where(dists < 6)[0][-1]
        png_trimmed = png[ii[:cutoff_idx]]
        print(png_trimmed.shape)
        np.random.shuffle(png_trimmed)
        if png_trimmed.shape[0] > 5000:
            png_trimmed = png_trimmed[::4]
        elif png_trimmed.shape[0] > 2500:
            png_trimmed = png_trimmed[::2]
        kd_tree = cKDTree(png_trimmed)

        # Create random starting points for clustering algorithm
        std = .1
        seeds = np.random.randn(num_seeds, 3) * std + point
        seeds = np.vstack((point, seeds))

        dists, sample_indices = kd_tree.query(seeds)


        cluster_res = self.find_cluster(sample_indices, png_trimmed, th_dist=.5, num_nn=20, num_samples=20)
        edges, corners = self.search_rectangle_fit(cluster_res["cluster"], variance_criterion)

        if plot:
            fig = plt.figure(figsize=(8,8))
            plt.scatter(cluster_res["cluster"][:,1], cluster_res["cluster"][:,0], c='g')
            plt.scatter(corners[:,1], corners[:,0], c='r')
            self.plot_edges(corners)
            plt.show()

        return self.corners_to_bounding_box(corners)

    def plot_edges(self, corners, num_samples=100, c='r', label=''):
        for i in range(4):
            v1, v2 = corners[i], corners[(i+1)%4]
            x = np.linspace(v1[0], v2[0], num_samples)
            y = np.linspace(v1[1], v2[1], num_samples)
            plt.plot(y, x, c=c, label=label)

    def search_farthest_nearest_neighbor(self, point, kd_tree, th_dist):
        num_nn = 2
        dists, nn_indices = kd_tree.query(point, num_nn)
        # print("th dist: ", th_dist)
        while (dists[-1] < th_dist):
            num_nn = num_nn * 2
            dists, nn_indices = kd_tree.query(point, num_nn)
        return dists, nn_indices

    def find_cluster(self, sample_indices, pc, th_dist=.2, density_thresh=10, num_nn=16, num_samples=20, overlap_thresh=.2):
        clusters = []
        seen_indices = []
        kd_tree = cKDTree(pc)
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
                dists, nn_indices = self.search_farthest_nearest_neighbor(point, kd_tree, th_dist)
                # dists, nn_indices = kd_tree.query(point, num_nn)
                if (len(nn_indices) > density_thresh):
                    for i in range(len(nn_indices)):
                        if nn_indices[i] not in seen and dists[i] < th_dist:
                            seen.add(nn_indices[i])
                            queue.append(nn_indices[i])
                
            clusters.append(np.vstack(cluster))
            seen_indices.append(np.array(list(seen)))
        
        overlapping_clusters = []
        # for i in range(len(seen_indices)):
        #     num_overlapping =  sum([len(np.intersect1d(seen_indices[i], seen_indices[j]))/len(seen_indices[i]) > overlap_thresh for j in range(len(seen_indices)) if j!=i])
        #     overlapping_clusters.append(num_overlapping)
        
        # largest_cluster = np.argmax(overlapping_clusters)
        # res = {"cluster": clusters[largest_cluster], "indices": seen_indices[largest_cluster]}

        # largest_cluster = np.unique(np.concatenate(seen_indices))
        largest_cluster = max(clusters, key=lambda cl:len(cl))
        res = {"cluster": largest_cluster, "indices": largest_cluster}
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
        # print(theta_star)
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

# if __name__ == '__main__':
#   DATA_DIR = 'input/bin_data'
#   OUT_DIR = 'input/ground_removed'
#   bin_data  = sorted([f for f in listdir(DATA_DIR) 
#                       if isfile(join(DATA_DIR, f)) and '.bin' in f])

#   frame_names = [f.split(".")[0] for f in bin_data]
#   print(frame_names)
#   fh = FrameHandler()
#   bp = BoundingBoxPredictor(fh)
#   # fname1 = '0000000000'
#   # fname2 = '0000000001'

#   # frame1 = fh.load_annotation(fname1)
#   # frame2 = fh.load_annotation(fname2)

#   # print(bp.predict_next_frame_bounding_boxes(frame2))
#   for fname in frame_names:
#       read_filename = join(DATA_DIR, fname.split(".")[0] + ".bin")
#       data = np.fromfile(read_filename, dtype=np.float32)
#       data = data.reshape((-1,4))[:,:3]
#       print('input shape: {}'.format(data.shape))
#       output = bp.ground_plane_fitting(data)['png']
#       output = np.hstack((output, np.zeros((len(output), 1))))
#       print('output shape: {}'.format(output.shape))
#       save_filename = join(OUT_DIR, fname.split(".")[0] + ".bin")
#       output.astype(np.float32).tofile(save_filename)





