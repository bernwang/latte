import numpy as np
import os

def oxts2pose(oxts):
    # function pose = convertOxtsToPose(oxts)
    # % converts a list of oxts measurements into metric poses,
    # % starting at (0,0,0) meters, OXTS coordinates are defined as
    # % x = forward, y = right, z = down (see OXTS RT3000 user manual)
    # % afterwards, pose{i} contains the transformation which takes a
    # % 3D point in the i'th frame and projects it into the oxts
    # % coordinates of the first frame.

    # % compute scale from first lat value
    scale = lat2scale(oxts[0][0])

    # % init pose
    pose = []
    Tr_0_inv = np.zeros((4,4))
    for i in range(len(oxts)):  
        
        # translation vector
        tx, ty = latlon2mercator(oxts[i][0], oxts[i][1], scale)
        tz = oxts[i][2]
        t = np.array([tx, ty, tz]).reshape((-1,1))
        # print("t: ", t)
        # rotation matrix (OXTS RT3000 user manual, page 71/92)
        rx = oxts[i][3] # roll
        ry = oxts[i][4] # pitch
        rz = oxts[i][5] # heading 
        Rx = np.array([[1,          0,           0],
                       [0, np.cos(rx), -np.sin(rx)],
                       [0, np.sin(rx),  np.cos(rx)]]) # base => nav  (level oxts => rotated oxts)
        Ry = np.array([[ np.cos(ry), 0, np.sin(ry)],
                       [          0, 1,          0],
                       [-np.sin(ry), 0, np.cos(ry)]]) # base => nav  (level oxts => rotated oxts)
        Rz = np.array([[np.cos(rz), -np.sin(rz), 0],
                       [np.sin(rz),  np.cos(rz), 0], 
                       [         0,           0, 1]]) # base => nav  (level oxts => rotated oxts)
        R  = Rz.dot(Ry.dot(Rx))
          
        g = np.vstack((np.hstack((R, t)), np.array([0, 0, 0, 1])))
        # normalize translation and rotation (start at 0/0/0)
        if i == 0:
            Tr_0_inv = np.linalg.inv(g)
      
        # add pose
        pose.append(Tr_0_inv.dot(g))
    print(pose[0].shape)
    return pose


def lat2scale(lat):
    # compute mercator scale from latitude
    scale = np.cos(lat * np.pi / 180.0)
    return scale

def latlon2mercator(lat, lon, scale):
    # converts lat/lon coordinates to mercator coordinates using mercator scale
    # returns: mx, my
    er = 6378137
    mx = scale * lon * np.pi * er / 180
    my = scale * er * np.log10(np.tan((90+lat) * np.pi / 360))
    return mx, my

def load_oxts_lite_data(base_dir, frames):
    # reads GPS/IMU data from files to memory. requires base directory
    # (=sequence directory as parameter). if frames is not specified, loads all frames.
    oxts = []
    for frame in frames:
        fname = frame.split(".")[0]
        filename = os.path.join(base_dir,'oxts/', fname + '.txt')
        print(filename)
        oxts.append(np.loadtxt(filename))
    return oxts

