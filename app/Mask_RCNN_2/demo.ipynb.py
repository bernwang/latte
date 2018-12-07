{
 "cells": [
  {
   "cell_type": "markdown",
   "metadata": {},
   "source": [
    "# Mask R-CNN Demo\n",
    "\n",
    "A quick intro to using the pre-trained model to detect and segment objects."
   ]
  },
  {
   "cell_type": "code",
   "execution_count": 1,
   "metadata": {},
   "outputs": [
    {
     "name": "stderr",
     "output_type": "stream",
     "text": [
      "Using TensorFlow backend.\n"
     ]
    }
   ],
   "source": [
    "import os\n",
    "import sys\n",
    "import random\n",
    "import math\n",
    "import numpy as np\n",
    "import skimage.io\n",
    "import matplotlib\n",
    "import matplotlib.pyplot as plt\n",
    "\n",
    "import coco\n",
    "import utils\n",
    "import model as modellib\n",
    "import visualize\n",
    "\n",
    "%matplotlib inline \n",
    "\n",
    "# Root directory of the project\n",
    "ROOT_DIR = os.getcwd()\n",
    "\n",
    "# Directory to save logs and trained model\n",
    "MODEL_DIR = os.path.join(ROOT_DIR, \"logs\")\n",
    "\n",
    "# Path to trained weights file\n",
    "# Download this file and place in the root of your \n",
    "# project (See README file for details)\n",
    "COCO_MODEL_PATH = os.path.join(ROOT_DIR, \"mask_rcnn_coco.h5\")\n",
    "\n",
    "# Directory of images to run detection on\n",
    "IMAGE_DIR = os.path.join(ROOT_DIR, \"images\")"
   ]
  },
  {
   "cell_type": "markdown",
   "metadata": {},
   "source": [
    "## Configurations\n",
    "\n",
    "We'll be using a model trained on the MS-COCO dataset. The configurations of this model are in the ```CocoConfig``` class in ```coco.py```.\n",
    "\n",
    "For inferencing, modify the configurations a bit to fit the task. To do so, sub-class the ```CocoConfig``` class and override the attributes you need to change."
   ]
  },
  {
   "cell_type": "code",
   "execution_count": 6,
   "metadata": {},
   "outputs": [
    {
     "name": "stdout",
     "output_type": "stream",
     "text": [
      "\n",
      "Configurations:\n",
      "BACKBONE_SHAPES                [[256 256]\n",
      " [128 128]\n",
      " [ 64  64]\n",
      " [ 32  32]\n",
      " [ 16  16]]\n",
      "BACKBONE_STRIDES               [4, 8, 16, 32, 64]\n",
      "BATCH_SIZE                     1\n",
      "BBOX_STD_DEV                   [0.1 0.1 0.2 0.2]\n",
      "DETECTION_MAX_INSTANCES        100\n",
      "DETECTION_MIN_CONFIDENCE       0.7\n",
      "DETECTION_NMS_THRESHOLD        0.3\n",
      "GPU_COUNT                      1\n",
      "IMAGES_PER_GPU                 1\n",
      "IMAGE_MAX_DIM                  1024\n",
      "IMAGE_MIN_DIM                  800\n",
      "IMAGE_PADDING                  True\n",
      "IMAGE_SHAPE                    [1024 1024    3]\n",
      "LEARNING_MOMENTUM              0.9\n",
      "LEARNING_RATE                  0.001\n",
      "MASK_POOL_SIZE                 14\n",
      "MASK_SHAPE                     [28, 28]\n",
      "MAX_GT_INSTANCES               100\n",
      "MEAN_PIXEL                     [123.7 116.8 103.9]\n",
      "MINI_MASK_SHAPE                (56, 56)\n",
      "NAME                           coco\n",
      "NUM_CLASSES                    81\n",
      "POOL_SIZE                      7\n",
      "POST_NMS_ROIS_INFERENCE        1000\n",
      "POST_NMS_ROIS_TRAINING         2000\n",
      "ROI_POSITIVE_RATIO             0.33\n",
      "RPN_ANCHOR_RATIOS              [0.5, 1, 2]\n",
      "RPN_ANCHOR_SCALES              (32, 64, 128, 256, 512)\n",
      "RPN_ANCHOR_STRIDE              1\n",
      "RPN_BBOX_STD_DEV               [0.1 0.1 0.2 0.2]\n",
      "RPN_NMS_THRESHOLD              0.7\n",
      "RPN_TRAIN_ANCHORS_PER_IMAGE    256\n",
      "STEPS_PER_EPOCH                1000\n",
      "TRAIN_ROIS_PER_IMAGE           200\n",
      "USE_MINI_MASK                  True\n",
      "USE_RPN_ROIS                   True\n",
      "VALIDATION_STEPS               50\n",
      "WEIGHT_DECAY                   0.0001\n",
      "\n",
      "\n"
     ]
    }
   ],
   "source": [
    "class InferenceConfig(coco.CocoConfig):\n",
    "    # Set batch size to 1 since we'll be running inference on\n",
    "    # one image at a time. Batch size = GPU_COUNT * IMAGES_PER_GPU\n",
    "    GPU_COUNT = 1\n",
    "    IMAGES_PER_GPU = 1\n",
    "\n",
    "config = InferenceConfig()\n",
    "config.display()"
   ]
  },
  {
   "cell_type": "markdown",
   "metadata": {},
   "source": [
    "## Create Model and Load Trained Weights"
   ]
  },
  {
   "cell_type": "code",
   "execution_count": 7,
   "metadata": {
    "scrolled": false
   },
   "outputs": [
    {
     "name": "stdout",
     "output_type": "stream",
     "text": [
      "/home/wjd/Desktop/Mask_RCNN-2.0/mask_rcnn_coco.h5\n"
     ]
    }
   ],
   "source": [
    "# Create model object in inference mode.\n",
    "model = modellib.MaskRCNN(mode=\"inference\", model_dir=MODEL_DIR, config=config)\n",
    "\n",
    "# Load weights trained on MS-COCO\n",
    "#model.load_weights(COCO_MODEL_PATH, by_name=True)\n",
    "print(COCO_MODEL_PATH)"
   ]
  },
  {
   "cell_type": "markdown",
   "metadata": {},
   "source": [
    "## Class Names\n",
    "\n",
    "The model classifies objects and returns class IDs, which are integer value that identify each class. Some datasets assign integer values to their classes and some don't. For example, in the MS-COCO dataset, the 'person' class is 1 and 'teddy bear' is 88. The IDs are often sequential, but not always. The COCO dataset, for example, has classes associated with class IDs 70 and 72, but not 71.\n",
    "\n",
    "To improve consistency, and to support training on data from multiple sources at the same time, our ```Dataset``` class assigns it's own sequential integer IDs to each class. For example, if you load the COCO dataset using our ```Dataset``` class, the 'person' class would get class ID = 1 (just like COCO) and the 'teddy bear' class is 78 (different from COCO). Keep that in mind when mapping class IDs to class names.\n",
    "\n",
    "To get the list of class names, you'd load the dataset and then use the ```class_names``` property like this.\n",
    "```\n",
    "# Load COCO dataset\n",
    "dataset = coco.CocoDataset()\n",
    "dataset.load_coco(COCO_DIR, \"train\")\n",
    "dataset.prepare()\n",
    "\n",
    "# Print class names\n",
    "print(dataset.class_names)\n",
    "```\n",
    "\n",
    "We don't want to require you to download the COCO dataset just to run this demo, so we're including the list of class names below. The index of the class name in the list represent its ID (first class is 0, second is 1, third is 2, ...etc.)"
   ]
  },
  {
   "cell_type": "code",
   "execution_count": 8,
   "metadata": {},
   "outputs": [],
   "source": [
    "# COCO Class names\n",
    "# Index of the class in the list is its ID. For example, to get ID of\n",
    "# the teddy bear class, use: class_names.index('teddy bear')\n",
    "class_names = ['BG', 'person', 'bicycle', 'car', 'motorcycle', 'airplane',\n",
    "               'bus', 'train', 'truck', 'boat', 'traffic light',\n",
    "               'fire hydrant', 'stop sign', 'parking meter', 'bench', 'bird',\n",
    "               'cat', 'dog', 'horse', 'sheep', 'cow', 'elephant', 'bear',\n",
    "               'zebra', 'giraffe', 'backpack', 'umbrella', 'handbag', 'tie',\n",
    "               'suitcase', 'frisbee', 'skis', 'snowboard', 'sports ball',\n",
    "               'kite', 'baseball bat', 'baseball glove', 'skateboard',\n",
    "               'surfboard', 'tennis racket', 'bottle', 'wine glass', 'cup',\n",
    "               'fork', 'knife', 'spoon', 'bowl', 'banana', 'apple',\n",
    "               'sandwich', 'orange', 'broccoli', 'carrot', 'hot dog', 'pizza',\n",
    "               'donut', 'cake', 'chair', 'couch', 'potted plant', 'bed',\n",
    "               'dining table', 'toilet', 'tv', 'laptop', 'mouse', 'remote',\n",
    "               'keyboard', 'cell phone', 'microwave', 'oven', 'toaster',\n",
    "               'sink', 'refrigerator', 'book', 'clock', 'vase', 'scissors',\n",
    "               'teddy bear', 'hair drier', 'toothbrush']"
   ]
  },
  {
   "cell_type": "markdown",
   "metadata": {},
   "source": [
    "## Run Object Detection"
   ]
  },
  {
   "cell_type": "code",
   "execution_count": null,
   "metadata": {
    "scrolled": false
   },
   "outputs": [
    {
     "name": "stdout",
     "output_type": "stream",
     "text": [
      "Processing 1 images\n",
      "image                    shape: (491, 640, 3)         min:    0.00000  max:  255.00000\n",
      "molded_images            shape: (1, 1024, 1024, 3)    min: -123.70000  max:  151.10000\n",
      "image_metas              shape: (1, 89)               min:    0.00000  max: 1024.00000\n"
     ]
    }
   ],
   "source": [
    "# Load a random image from the images folder\n",
    "file_names = next(os.walk(IMAGE_DIR))[2]\n",
    "image = skimage.io.imread(os.path.join(IMAGE_DIR, random.choice(file_names)))\n",
    "\n",
    "# Run detection\n",
    "results = model.detect([image], verbose=1)\n",
    "\n",
    "# Visualize results\n",
    "r = results[0]\n",
    "visualize.display_instances(image, r['rois'], r['masks'], r['class_ids'], \n",
    "                            class_names, r['scores'])"
   ]
  },
  {
   "cell_type": "code",
   "execution_count": null,
   "metadata": {},
   "outputs": [],
   "source": []
  },
  {
   "cell_type": "code",
   "execution_count": null,
   "metadata": {},
   "outputs": [],
   "source": []
  }
 ],
 "metadata": {
  "kernelspec": {
   "display_name": "Python 3",
   "language": "python",
   "name": "python3"
  },
  "language_info": {
   "codemirror_mode": {
    "name": "ipython",
    "version": 3
   },
   "file_extension": ".py",
   "mimetype": "text/x-python",
   "name": "python",
   "nbconvert_exporter": "python",
   "pygments_lexer": "ipython3",
   "version": "3.4.3"
  }
 },
 "nbformat": 4,
 "nbformat_minor": 2
}
