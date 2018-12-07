#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Created on Fri Aug 17 14:45:29 2018

@author: bc
"""
import matplotlib
matplotlib.use('TkAgg')

import tkinter as tk
from tkinter import filedialog


def openFile(): 
    root = tk.Tk()
    root.update()
    filename = filedialog.askopenfilename(title = "Select image file")
    root.destroy()
    return filename

def openBin():
    binfile = tk.Tk()
    binfile.update()
    binfilename = filedialog.askopenfilename(title = "Select bin file")
    binfile.destroy()
    return binfilename