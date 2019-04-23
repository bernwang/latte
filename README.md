# _LATTE_: Accelerating LiDAR Point Cloud Annotation via Sensor Fusion, One-Click Annotation, and Tracking

With LATTE, we are able to accelerate LiDAR point cloud annotation by 6.2x and significantly improve label quality with 23.6% and 2.2% higher instance-level precision and recall, and 2.0% higher bounding box IoU.

By Bernie Wang, Virginia Wu, Bichen Wu, Kurt Keutzer

A demonstration of LATTE can be found below:

![Alt Text](https://github.com/bernwang/LiDAR-annotator/blob/master/gifs/github_repo_demo.gif)

Please refer to our video for a more in-depth demo: https://www.youtube.com/watch?v=QWjWpqvYA_c. For more details, please refer to our paper: https://arxiv.org/abs/1904.09085. If you find this work useful for your research, please consider citing:
``` 
   @article{wang2019latte,
      title={LATTE: Accelerating LiDAR Point Cloud Annotation via Sensor Fusion, One-Click Annotation, and Tracking},
      author={Wang, Bernie and Wu, Virginia and Wu, Bichen and Keutzer, Kurt},
      journal={arXiv preprint arXiv:1904.09085},
      year={2019}
   }
   ```
   
Related works:
```
   @article{wu2017squeezeseg,
       title={Squeezeseg: Convolutional neural nets with recurrent crf for real-time road-object segmentation from 3d lidar point cloud},
       author={Wu, Bichen and Wan, Alvin and Yue, Xiangyu and Keutzer, Kurt},
       journal={ICRA},
       year={2018}
   }
   @inproceedings{wu2018squeezesegv2,
       title={SqueezeSegV2: Improved Model Structure and Unsupervised Domain Adaptation for Road-Object Segmentation from a LiDAR Point            Cloud},
       author={Wu, Bichen and Zhou, Xuanyu and Zhao, Sicheng and Yue, Xiangyu and Keutzer, Kurt},
       booktitle={ICRA},
       year={2019},
   }
   @inproceedings{yue2018lidar,
       title={A lidar point cloud generator: from a virtual world to autonomous driving},
       author={Yue, Xiangyu and Wu, Bichen and Seshia, Sanjit A and Keutzer, Kurt and Sangiovanni-Vincentelli, Alberto L},
       booktitle={ICMR},
       pages={458--464},
       year={2018},
       organization={ACM}
   }
```

## Installation
1. Clone this repository
2. Setup virtual environment:
   ```Shell
   virtualenv env
   ```
   Activate the virtual environment
   ```Shell
   source env/bin/activate
   ```
3. Install dependencies. By default we use Python3.
   ```bash
   pip3 install -r requirements.txt
   ```
4. Download pre-trained COCO weights (mask_rcnn_coco.h5) from the [releases page](https://github.com/matterport/Mask_RCNN/releases) into app/Mask_RCNN.
5. To run the tool, run `python app.py` in wherever you have your `app` directory is
6. Open http://127.0.0.1:5000/ on a browser (FireFox has been noted to have compatibility issues)

# Annotation quick start guide
1. Batches of frames are found in `app/test_datasets`
2. Segmentation performed by Mask R-CNN is done when a frame is loaded
3. To draw bounding box, see Drawing bounding boxes
4. For one-click annotation, hold the a key and click on a point cloud. You can make fine adjustments if necessary. 
5. To move onto the next frame, click one the name of the next frame. Annotation will automatically save when you switch frames
6. When moving on to the next frame, tracking will propagate predicted bounding boxes. Adjustments should be made to correct any misalignment. 
7. There is a save button on the top left. The last frame does not automatically save so please use that save button instead. 
8. When you're ready to annotate the next batch, repeat steps 2 to 6.

# Annotating your own LiDAR data
Your LiDAR data should include a binary file of the full point cloud, a binary file of the point cloud with the ground removed, and an image. See app/test_dataset for examples. After you have formated your data, place them in app/test_dataset. 

# Operations for Annotation

## One-click bounding box drawing
![Alt Text](https://github.com/bernwang/LiDAR-annotator/blob/master/gifs/one_click_annotation_cropped.gif)
1. Instead of holding the control key, hold the `a` key. Then click a point in the cluster and the tool will draw a bounding box. 
2. You can adjust the auto-drawn bounding box afterwards

## Frame-by-frame tracking
- After annotating a frame, the next frame can be auto-annotated. 

## Sensor Fusion
- 3D point cloud is projected onto the image which is then segmented by Mask R-CNN. The 3D points that are projected onto the masks are highlighted, and the segmented image is displayed.
- An image classifier is used to pre-label a bounding box when it is manually drawn. 

## Drawing Bounding Boxes

![Alt Text](https://github.com/bernwang/LiDAR-annotator/blob/master/gifs/step1.gif)

Bounding boxes can be drawn by holding the control key and clicking and dragging. When drawing bounding boxes, please view in 2D mode (rightmost button): 

![Alt Text](https://github.com/bernwang/LiDAR-annotator/blob/master/images/different_modes.png)

The control key must held down for all bounding box operations. The follow features are supported:
### Resizing
1. To resize bounding box, click and drag the "corner" vertices
2. You can only click and drag on a corner vertex if it is blue. It will turn blue if your mouse is close enough to it. 

### Translation
- When your cursor is inside the box and the box color changes to red, you can drag it around. 

### Rotation

![Alt Text](https://github.com/bernwang/LiDAR-annotator/blob/master/images/bounding_box.png)

1. To rotate bounding box, click and drag the point that is not a corner vertex (it should be between two corner vertices) and box will rotate with the point. 

### Deletion
- To delete bounding box, press the backspace/delete key while the bounding box is selected. 

## Controls
### "3D" mode
1. Left click and drag to orbit around the point cloud
2. Right click and drag to translate.
3. You can label objects in "3D" mode (see "labelling bounding boxes")

### Labelling Bounding Boxes
1. Click on the index of a bounding box in the "object id table" and its corresponding bounding box will change color to blue.
2. To change label, just change the value in the dropdown input, and the bounding box's object id will save automatically on input change
3. You can also delete a bounding box by selecting its corresponding row, and the bounding box should turn blue. Then press the delete or backspace key to delete the bounding box. Its corresponding table row should also be deleted. 

# LiDAR Format
This version of the app assumes the LiDAR data to be stored in a binary float matrix (.bin extension). 
Each column is a point, where the rows are in the following order: x, y, z, and intensity (little endian).
See the 3D Velodyne point clouds in [KITTI's dataset](http://www.cvlibs.net/datasets/kitti/raw_data.php) for example. 
