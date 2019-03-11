class ParticleFilter():
	def __init__(self, poses, thetas, pointclouds, N=100):
		self.N = N
		self.frames = []
		self.poses = poses
		self.thetas = thetas
		self.pointclouds = pointclouds
		self.weights = np.ones(N)
		self.particles = np.zeros((N, 3))
		self.std = np.array([.1, .1, .01])
		self.prev = None
		self.prev2 = None
		self.bounding_boxes = []
		self.predicted_centers = []
		self.iter = 2

	def set_prev(self, pc):
		if not self.prev2:
			self.prev2 = pc
		elif not self.prev:
			self.prev = pc
			self.init_particles()
		else:
			self.prev2 = prev
			self.prev = pc

	def init_particles(self):
		mean = np.hstack((homogeneous_transform_2d(self.poses[1], self.bounding_boxes[1].center), 
                      np.array([self.bounding_boxes[1].angle - self.thetas[0]])))
		self.particles = create_gaussian_particles(mean, self.std, self.N)

	def predict(self):
		i = self.iter 
		pc = self.pointclouds[i-1]
        _, pc_filtered = self.bounding_boxes[i-1].filter_pointcloud(pc)
        pc_world = homogeneous_transform_3d(self.poses[i-1], pc_filtered.T).T
        
        obs = self.pointclouds[i]
        _, obs_filtered = self.bounding_boxes[i].filter_pointcloud(obs)
        obs_filtered_world = homogeneous_transform_3d(self.poses[i], obs_filtered.T).T
        
        v_world = homogeneous_transform_2d(self.poses[i-1], self.bounding_boxes[i-1].center) - homogeneous_transform_2d(self.poses[i-2], self.bounding_boxes[i-2].center)
        dtheta = self.bounding_boxes[i-1].angle - self.bounding_boxes[i-2].angle
        
        w, l, theta = self.bounding_boxes[i-1].w, self.bounding_boxes[i-1].l, self.bounding_boxes[i-1].angle - thetas[0]
        
        predict(particles, v_world, dtheta, std)
        
    def update(self, new_bounding_box, obs):
    	i = self.iter
        mu, var = estimate(self.particles, self.weights)
        self.predicted_centers.append(homogeneous_transform_2d(np.linalg.inv(self.poses[i]), mu, ndim=3))
        mu_body = homogeneous_transform_2d(np.linalg.inv(self.poses[i]), mu)

        w_obs, l_obs, theta_obs = self.bounding_boxes[i].w, self.bounding_boxes[i].l, self.bounding_boxes[i].angle - thetas[0]
        # incorporate measurements
        update(particles, weights, obs, obs_filtered_world, w_obs, l_obs)
    return predicted_centers


def create_uniform_particles(x_range, y_range, hdg_range, N):
    particles = np.empty((N, 3))
    particles[:, 0] = uniform(x_range[0], x_range[1], size=N)
    particles[:, 1] = uniform(y_range[0], y_range[1], size=N)
    particles[:, 2] = uniform(hdg_range[0], hdg_range[1], size=N)
    particles[:, 2] %= 2 * np.pi
    return particles

def create_gaussian_particles(mean, std, N):
    particles = np.empty((N, 3))
    particles[:, 0] = mean[0] + (randn(N) * std[0])
    particles[:, 1] = mean[1] + (randn(N) * std[1])
    particles[:, 2] = mean[2] + (randn(N) * std[2])
    particles[:, 2] %= 2 * np.pi
    return particles

class BatchParticleFilters():

