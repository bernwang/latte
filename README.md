# _LATTE_: Accelerating LiDAR Point Cloud Annotation via Sensor Fusion, One-Click Annotation, and Tracking

By Bernie Wang, Virginia Wu, Bichen Wu, Kurt Keutzer

LiDAR annotation tool using ray tracing and bounding boxes. A demonstration of LATTE can be found below:

![Alt Text](https://github.com/bernwang/LiDAR-annotator/blob/evaluation/gifs/step1.gif)

Please refer to our video for a more in-depth demo: https://www.youtube.com/watch?v=QWjWpqvYA_c. For more details, please refer to our paper: https://arxiv.org/abs/1904.09085. If you find this work useful for your research, please consider citing:
``` 
   @unpublished{wang2019latte,
      title={LATTE: Accelerating LiDAR Point Cloud Annotation via Sensor Fusion, One-Click Annotation, and Tracking},
      author={Wang, Bernie and Wu, Virginia and Wu, Bichen and Keutzer, Kurt},
      year={2019}
   }
```

## Installation
1. Clone this repository
2. Checkout the evaluation branch
   ```bash
   git checkout evaluation`
   ```
2. Install dependencies
   ```bash
   pip3 install -r requirements.txt
   ```
3. Download pre-trained COCO weights (mask_rcnn_coco.h5) from the [releases page](https://github.com/matterport/Mask_RCNN/releases) into app/Mask_RCNN.
4. To run the tool, run `python app.py` in wherever you have your `app` directory is
5. Open http://127.0.0.1:5000/ on a browser (preferably Chrome, but definitely not FireFox)

# Annotation quick start guide
1. Batches of frames are found in `app/test_datasets`
2. Copy one of the folders in directory to `app` (it should look like `app/<number>_drive_<number>_sync`) and rename it to input (`app/input`). Make sure `app/output` directory is empty. 
4. To move onto the next frame, click "Next frame". Annotation will automatically save when you switch frames. There is a save button on the top left. The last frame does not automatically save so please use that save button instead. 
5. Please look at the "controls" section to understand how to draw/edit bounding boxes. 
6. After all frames in the batch are annotated, please move them (in `app/output`) to `app/test_outputs/<drive_name>` where `drive_name` is the name of the input directory.
7. When you're ready to annotate the next batch, repeat steps 1 to 6.

# Annotating your own LiDAR data
Your LiDAR data should include a binary file of the full point cloud, a binary file of the point cloud with the ground removed, and an image. See app/test_dataset for examples. After you have formated your data, place them in app/test_dataset. 

# Drawing bounding boxes
Bounding boxes can be drawn by holding the control key and clicking and dragging. When drawing bounding boxes, please view in 2D mode (rightmost button): 

![Alt Text](https://github.com/bernwang/LiDAR-annotator/blob/evaluation/images/different_modes.png)

The control key must held down for all bounding box operations. The follow features are supported:
## Resizing
1. To resize bounding box, click and drag the "corner" vertices
2. You can only click and drag on a corner vertex if it is blue. It will turn blue if your mouse is close enough to it. 

## Translation
1. When your cursor is inside the box and the box color changes to red, you can drag it around. 

## Rotation

![Alt Text](https://github.com/bernwang/LiDAR-annotator/blob/evaluation/images/bounding_box.png)

1. To rotate bounding box, click and drag the point that is not a corner vertex (it should be between two corner vertices) and box will rotate with the point. 

## Deletion
1. To delete bounding box, press the backspace/delete key while the bounding box is selected. 

## One-click bounding box drawing
1. Instead of holding the control key, hold the `a` key. Then click a point in the cluster and the tool will draw a bounding box. 
2. You can adjust the auto-drawn bounding box afterwards

## Frame-by-frame tracking
1. After annotating a frame, the next frame can be auto-annotated. 

# Controls
## "3D" mode
1. Left click and drag to orbit around the point cloud
2. Right click and drag to translate.
3. You can label objects in "3D" mode (see "labelling bounding boxes")

## Labelling Bounding Boxes
1. Click on the index of a bounding box in the "object id table" and its corresponding bounding box will change color to blue.
2. To change label, just change the value in the dropdown input, and the bounding box's object id will save automatically on input change
3. You can also delete a bounding box by selecting its corresponding row, and the bounding box should turn blue. Then press the delete or backspace key to delete the bounding box. Its corresponding table row should also be deleted. 

# LiDAR Format
This version of the app assumes the LiDAR data to be stored in a binary float matrix (.bin extension). 
Each column is a point, where the rows are in the following order: x, y, z, and intensity (little endian).
See the 3D Velodyne point clouds in [KITTI's dataset](http://www.cvlibs.net/datasets/kitti/raw_data.php) for example. 
