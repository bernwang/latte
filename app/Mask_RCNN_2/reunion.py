#!/usr/bin/env python3
# -*- coding: utf-8 -*-

#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Created on Fri Jul 27 11:42:30 2018

@author: bc
"""
import matplotlib
matplotlib.use('TkAgg')
import os

import numpy as np
from PIL import Image

import matplotlib.pyplot as plt
from calib import Calib
import chooseFile

import io
import json
import time
path = '/Users/bc/Downloads/'
dirs = os.listdir(path)

def getCurrentDirs():
    time.sleep(5)
    dirs = os.listdir(path)
    return dirs

def getNumFiles(path):
    numFiles = 0
    for i in os.listdir(path):
        numFiles +=1
    return numFiles

def loadJson():
    image_ab_path = chooseFile.openFile()
    while True:
        num_file = getNumFiles(path)
        for i in getCurrentDirs():
            if getNumFiles(path) > num_file and os.path.splitext(i)[1] == ".json":
                jsonFile = i
                f = io.open("/Users/bc/Downloads/"+ jsonFile, encoding='utf-8')
                        #设置以utf-8解码模式读取文件，encoding参数必须设置，否则默认以gbk模式读取文件，当文件中包含中文时，会报错
                setting = json.load(f)
                file = setting['frames'][0].get('filename')
                x = []
                y = []
                width = []
                length = []
                family = setting['frames'][0]
                for j in range(len(family.get('bounding_boxes'))):
                    x.append(family.get('bounding_boxes')[j].get('center').get('x'))
                    y.append(family.get('bounding_boxes')[j].get('center').get('y'))
                    width.append(family.get('bounding_boxes')[j].get('width'))
                    length.append(family.get('bounding_boxes')[j].get('length'))
                
                current_dir_path = os.path.dirname(os.path.realpath(__file__))
                #image_ab_path = chooseFile.openFile()
                bin_ab_path = current_dir_path+'/'
                
                calib = Calib('/Users/bc/3d-2d/calib')
                im = Image.open(os.path.join(image_ab_path))
                w, h = im.size
                
                scan = np.fromfile(
                    os.path.join(bin_ab_path+file),
                    dtype=np.float32).reshape((-1, 4))

    
                a_array = np.array([0],dtype = np.float32)
                for i in range(len(x)):
                    a = x[i]
                    b = y[i]
                    c = width[i]/2
                    d = length[i]/2
                    #e = angle[i]
                    for j in range(len(scan)):
                        if scan[j][0] > a - c and scan[j][0] < a + c and scan[j][1] > b - d and scan[j][1]< b + d:
                            a_array = np.append(a_array,scan[j])
                a_array = np.delete(a_array,0)
                a_array = a_array.reshape((int(len(a_array)/4),4))
                
                im_coord = calib.velo2img(a_array[:, :3], 2).astype(np.int)
                plt.imshow(im)
                
                x_arr = []
                y_arr = []
                
                for i in range(len(im_coord)):
                    x_arr.append(im_coord[i][0])
                    y_arr.append(im_coord[i][1])
            
            
                plt.scatter(x_arr,y_arr,s = 1)
                plt.show()
                
                num_file = getNumFiles(path)

if __name__ == '__main__':
   loadJson()
