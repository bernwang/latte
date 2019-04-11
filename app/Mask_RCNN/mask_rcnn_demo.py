import matplotlib
matplotlib.use('TkAgg')
import os
import sys
import random
import math
import numpy as np
import skimage.io
import matplotlib
import matplotlib.pyplot as plt

import coco
import utils
import model as modellib
import visualize

import PIL
from PIL import Image
from calib import Calib
from time import time
#%matplotlib inline 

import chooseFile
import argparse
import matplotlib.path as mpltPath

def main(data_filename):
    # Root directory of the project

    # data_filename = FLAGS.image_filename
    ROOT_DIR = os.path.dirname(os.path.realpath(__file__))
    print(ROOT_DIR)

    # Directory to save logs and trained model
    MODEL_DIR = os.path.join(ROOT_DIR, "logs")

    # Directory to get binary and image data
    PARENT_DIR = os.path.abspath(os.path.join(ROOT_DIR, os.pardir))
    DATA_DIR = os.path.join(PARENT_DIR, "test_dataset")

    # Local path to trained weights file
    COCO_MODEL_PATH =  os.path.join(ROOT_DIR, "mask_rcnn_coco.h5")


    # Directory of images to run detection on
    #IMAGE_DIR = os.path.join(ROOT_DIR, "images")

    class InferenceConfig(coco.CocoConfig):
        # Set batch size to 1 since we'll be running inference on
        # one image at a time. Batch size = GPU_COUNT * IMAGES_PER_GPU
        GPU_COUNT = 1
        IMAGES_PER_GPU = 1

    config = InferenceConfig()
    # config.display()


    # Create model object in inference mode.
    model = modellib.MaskRCNN(mode="inference", model_dir=MODEL_DIR, config=config)

    # Load weights trained on MS-COCO
    model.load_weights(COCO_MODEL_PATH, by_name=True)


    # COCO Class names
    # Index of the class in the list is its ID. For example, to get ID of
    # the teddy bear class, use: class_names.index('teddy bear')
    class_names = ['BG', 'person', 'bicycle', 'car', 'motorcycle', 'airplane',
                   'bus', 'train', 'truck', 'boat', 'traffic light',
                   'fire hydrant', 'stop sign', 'parking meter', 'bench', 'bird',
                   'cat', 'dog', 'horse', 'sheep', 'cow', 'elephant', 'bear',
                   'zebra', 'giraffe', 'backpack', 'umbrella', 'handbag', 'tie',
                   'suitcase', 'frisbee', 'skis', 'snowboard', 'sports ball',
                   'kite', 'baseball bat', 'baseball glove', 'skateboard',
                   'surfboard', 'tennis racket', 'bottle', 'wine glass', 'cup',
                   'fork', 'knife', 'spoon', 'bowl', 'banana', 'apple',
                   'sandwich', 'orange', 'broccoli', 'carrot', 'hot dog', 'pizza',
                   'donut', 'cake', 'chair', 'couch', 'potted plant', 'bed',
                   'dining table', 'toilet', 'tv', 'laptop', 'mouse', 'remote',
                   'keyboard', 'cell phone', 'microwave', 'oven', 'toaster',
                   'sink', 'refrigerator', 'book', 'clock', 'vase', 'scissors',
                   'teddy bear', 'hair drier', 'toothbrush']



    # Load a random image from the images folder
    #file_names = next(os.walk(IMAGE_DIR))[2]

    # filename = chooseFile.openFile()
    drivename, fname = data_filename.split("/")
    filename = os.path.join(DATA_DIR, drivename, "image", fname) + ".png"
    image = Image.open(filename)
    start = time()
    img = skimage.io.imread(filename)
    #image = skimage.io.imread(os.path.join(IMAGE_DIR,file_names))

    # Run detection
    results = model.detect([img], verbose=1)
    print(type(img))
    # Visualize results
    r = results[0]
    print("identify image time: " + str(time()-start))
    contour = visualize.display_instances(img, r['rois'], r['masks'], r['class_ids'], class_names, r['scores'])
    print(r['class_ids'])
    # visualize.display_instances(img, r['rois'], r['masks'], r['class_ids'], class_names, r['scores'])

    calib = Calib('/Users/berniewang/annotator/lidarAnnotator/app/classify/calib')
    im = PIL.Image.open(os.path.join(filename))
    w, h = im.size
    bin_name = os.path.join(DATA_DIR, drivename, "bin_data", fname) + ".bin"
    scan = np.fromfile(
        os.path.join(bin_name),
        dtype=np.float32).reshape((-1, 4))
    # print("scan: ", scan[0])
    im_coord = calib.velo2img(scan[:, :3], 2).astype(np.int)
    im_coord2 = [im_coord[i] for i in range(len(im_coord)) if im_coord[i][0] > 0 and im_coord[i][0] <= w and im_coord[i][1] > 0 and im_coord[i][1] <= h and scan[i][0]>=0]
    #scan2 = [scan[i] for i in range(len(im_coord)) if im_coord[i][0] > 0 and im_coord[i][0] <= w and im_coord[i][1] > 0 and im_coord[i][1] <= h]

    scan2 = np.array([0],dtype = np.float32)
    visible_indices = np.array([0],dtype = np.int)
    for i in range(len(im_coord)):
        if im_coord[i][0] > 0 and im_coord[i][0] <= w and im_coord[i][1] > 0 and im_coord[i][1] <= h:
            if scan[i][0] >= 0:
                scan2 = np.append(scan2,scan[i])
                visible_indices = np.append(visible_indices, i)
    scan2 = np.delete(scan2,0)
    visible_indices = np.delete(visible_indices, 0)
    scan2 = scan2.reshape((int(len(scan2)/4),4))
    #scan2.tofile("scan2.bin")
    '''
    def ray_tracing_method(x,y,poly):
        n = len(poly)
        inside = False

        p1x,p1y = poly[0]
        for i in range(n+1):
            p2x,p2y = poly[i % n]
            if y > min(p1y,p2y):
                if y <= max(p1y,p2y):
                    if x <= max(p1x,p2x):
                        if p1y != p2y:
                            xints = (y-p1y)*(p2x-p1x)/(p2y-p1y)+p1x
                        if p1x == p2x or x <= xints:
                            inside = not inside
            p1x,p1y = p2x,p2y
        return inside
    '''
    start_time = time()
    print(len(contour))
    bounded_indices = np.array([0], dtype=np.int)
    for i in range(len(contour)):
        #print(len(contour))
        for q in contour[i][0]:
            temp = q[0]
            q[0] = q[1]
            q[1] = temp
        #print(contour[i][0])

        #if len(contour[i][0])>=130:
        polygon = [q for q in contour[i][0]]
        path = mpltPath.Path(polygon)
        inside2 = path.contains_points(im_coord2)    
        #inside1 = [ray_tracing_method(p[1], p[0], polygon) for p in im_coord2]
        im_coord3 = []
        scan3 = np.array([0],dtype = np.float32)
        
        for j in range(len(inside2)):
            if inside2[j] ==True:
                scan3 = np.append(scan3,scan2[j])
                bounded_indices = np.append(bounded_indices, visible_indices[j])
        scan3 = np.delete(scan3,0)  
        # print("bounded_indices: ", bounded_indices.shape, bounded_indices)
        scan3 = scan3.reshape((int(len(scan3)/4),4))
        # print(len(scan3))
        # print(scan3)
        class_id = r['class_ids'][i]
        label = class_names[class_id]

        if len(scan3) != 0: 
            pass
        #print(len(scan3))
            # commented out
            # scan3.tofile("sample%s%s.bin"%(label,i))
        #scan4 = np.append(scan3,scan)
        #scan4.tofile("a.bin")
        
        class_id = r['class_ids'][i]
        label = class_names[class_id]

    bounded_indices = np.delete(bounded_indices, 0)
    bounded_indices.tofile(os.path.join(ROOT_DIR, "output/indices.bin"))
    print("Matplotlib contains_points Elapsed time: " + str(time()-start_time))

    #getContour()
    # return bounded_indices
    # plt.scatter(im_coord[bounded_indices,0], im_coord[bounded_indices,1])
    # plt.imshow(img)
    # plt.show()

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument(
        '--image_filename',
        type=str,
        default='',
        help='image filename.'
    )

    FLAGS, unparsed = parser.parse_known_args()
    main(FLAGS.image_filename)


