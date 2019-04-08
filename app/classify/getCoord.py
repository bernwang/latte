#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Created on Fri Jul 27 11:42:30 2018

@author: bc
"""
import io
import json
import os
import time

CUR_DIR = os.path.dirname(os.path.realpath(__file__))
path = os.path.join(CUR_DIR, 'bounding_boxes/')
dirs = os.listdir(path)

def getCurrentDirs():
    dirs = os.listdir(path)
    return dirs

def getNumFiles(path):
    numFiles = 0
    for i in os.listdir(path):
        numFiles +=1
    return numFiles

def loadJson():
    #num_file = getNumFiles(path)
    #print(num_file)
    #print(os.listdir(path))
    while True:
        #time.sleep(3)
        for i in getCurrentDirs():
            if os.path.splitext(i)[1] == ".json":
                jsonFile = i
                #print(jsonFile)
                f = io.open(path+ jsonFile, encoding='utf-8')
                        #设置以utf-8解码模式读取文件，encoding参数必须设置，否则默认以gbk模式读取文件，当文件中包含中文时，会报错
                setting = json.load(f)
                return setting
    '''
        if getNumFiles(path) > num_file:
            print(getNumFiles(path))
            print(num_file)
            jsonFile = ""
            #print(getCurrentDirs())
            for i in getCurrentDirs():
                if os.path.splitext(i)[1] == ".json":
                    jsonFile = i
            print(jsonFile)
            f = io.open("/Users/bc/Downloads/"+ jsonFile, encoding='utf-8')
                        #设置以utf-8解码模式读取文件，encoding参数必须设置，否则默认以gbk模式读取文件，当文件中包含中文时，会报错
            setting = json.load(f)
            #print(num_file)
            return setting
        #num_file += 1
                    #family = setting['frames'][0]
    '''

def getFileName():
    f = loadJson()
    file = f['frames'][0].get('filename')
    return file

def getPictureName():
    a = getFileName()
    p = a.replace("bin","png")
    return p

def getX():
    x = []
    f = loadJson()
    family = f['frames'][0]
    #print(family.get('bounding_boxes')[0].get('center'))
    for i in range(len(family.get('bounding_boxes'))):
        #if family.get('bounding_boxes')[i].get('center').get('x')>=0:
        x.append(family.get('bounding_boxes')[i].get('center').get('x'))
        '''
        else:
            filename = 'write_data.txt'
            with open(filename,'a') as f: # 如果filename不存在会自动创建， 'w'表示写数据，写之前会清空文件中的原有数据
                f.write("your frame can not show on the picture\n")
            print("your frame can not show on the picture")
        '''
    return x

def getY():
    y = []
    f = loadJson()
    family = f['frames'][0]
    for i in range(len(family.get('bounding_boxes'))):
        #if family.get('bounding_boxes')[i].get('center').get('x')>=0:
        y.append(family.get('bounding_boxes')[i].get('center').get('y'))
    return y

def getWidth():
    width = []
    f = loadJson()
    family = f['frames'][0]
    for i in range(len(family.get('bounding_boxes'))):
        #if family.get('bounding_boxes')[i].get('center').get('x')>=0:
        width.append(family.get('bounding_boxes')[i].get('width'))
    return width

def getLength():
    length = []
    f = loadJson()
    family = f['frames'][0]
    for i in range(len(family.get('bounding_boxes'))):
        #if family.get('bounding_boxes')[i].get('center').get('x')>=0:
        length.append(family.get('bounding_boxes')[i].get('length'))
    return length

def getAngle():
    angle = []
    f = loadJson()
    #print(f)
    family = f['frames'][0]
    #print(family)
    for i in range(len(family.get('bounding_boxes'))):
        #if family.get('bounding_boxes')[i].get('center').get('x')>=0:
        angle.append(family.get('bounding_boxes')[i].get('angle'))
    return angle
'''
def getNumFiles(path):
    numFiles = 0
    for i in os.listdir(path):
        numFiles +=1
    return numFiles
'''
'''
def main():
    num_file = getNumFiles(path)
    while True:
        if getNumFiles(path) > num_file + 1:
            loadJson()
            num_file += 1
            print("success")
'''



