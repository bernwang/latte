# LiDAR Annotator
## Bernie Wang, Virginia Wu, Bichen Wu, Kurt Keutzer
LiDAR annotation tool using ray tracing and bounding boxes.
![Alt Text](https://github.com/bernwang/LiDAR-annotator/blob/evaluation/gifs/step1.gif)
Demo Video: [https://www.youtube.com/watch?v=QWjWpqvYA_c](https://www.youtube.com/watch?v=QWjWpqvYA_c&feature=youtu.be)

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
3. To run the tool, run `python app.py` in wherever you have your `app` directory is
4. Open http://127.0.0.1:5000/ on a browser (preferably Chrome, but definitely not FireFox)

# For people using the annotator for the efficiency test, read this first
1. Batches of frames are found in `app/test_datasets`
2. Copy one of the folders in directory to `app` (it should look like `app/<number>_drive_<number>_sync`) and rename it to input (`app/input`). Make sure `app/output` directory is empty. 
3. There is a record button so that you can pause the test if you want. This will disable most functionality of the tool. Please pause if you want to take a break, but it is suggested to take breaks between batches. Click on the button again to resume recording. Recording will be automatically paused when you move onto a new frame. 
4. To move onto the next frame, click "Next frame". Annotation will automatically save when you switch frames. There is a save button on the top left. The last frame does not automatically save so please use that save button instead. 
5. Please look at the "controls" section to understand how to draw/edit bounding boxes. Read "my strategy for annotating" for a quickstart on annotating. In my opinion, this is the most efficient way to annotate with this current version for people who are new. 
6. After all frames in the batch are annotated, please move them (in `app/output`) to `app/test_outputs/<drive_name>` where `drive_name` is the name of the input directory.
7. When you're ready to annotate the next batch, repeat steps 1 to 6.
8. Thank you for participating in the efficiency test! Your time and effort goes into making the LiDAR annotater better!


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

<!---
# My strategy for annotating
1. Go into "draw" mode. Draw bounding boxes for all objects of interest (i.e. vehicles, pedestrians, cyclists). 
2. Then, in "3D mode", for each row in the Object ID table, click on the object number, and its corresponding bounding box will turn blue. Then adjust the object id (car, van, truck, etc.) to what you think that object is. If the object is not an object of interest, just hit the delete or backspace key to delete the bounding box. 
![Alt Text](https://github.com/bernwang/LiDAR-annotator/blob/evaluation/gifs/step2.gif)
3. If you miss any object of interest, go back to "draw" mode to draw a bounding box for it.
4. Repeat (1) through (3) until you think that all objects of interest are covered.
--->
# Controls
## "3D" mode
1. Left click and drag to orbit around the point cloud
2. Right click and drag to translate.
3. You can label objects in "3D" mode (see "labelling bounding boxes")

<!---
## "2D/Draw" mode
(Note: While in "2D move" mode, hold the control key to be in "draw mode")
1. Click and drag to draw a bounding box and release to set it
2. To resize bounding box, click and drag the "corner" vertices
3. You can only click and drag on a corner vertex if it is blue. It will turn blue if your mouse is close enough to it. 
3. To rotate bounding box, click and drag the point that is not a corner vertex (it should be between two corner vertices) and box will rotate with the point. 
4. To "select" bounding box, first hover above it. You can tell it is hovered if it turns red. Then click somewhere strictly inside a bounding box, and the borders will turn blue. 
5. To delete bounding box, press the backspace/delete key while the bounding box is selected. 
6. When a bounding box is selected, the input for its corresponding row in the object ID table is focused. (see "labelling bounding boxes")
--->

## Labelling Bounding Boxes
1. Click on the index of a bounding box in the "object id table" and its corresponding bounding box will change color to blue.
2. To change label, just change the value in the dropdown input, and the bounding box's object id will save automatically on input change
3. You can also delete a bounding box by selecting its corresponding row, and the bounding box should turn blue. Then press the delete or backspace key to delete the bounding box. Its corresponding table row should also be deleted. 

# LiDAR Format
This version of the app assumes the LiDAR data to be stored in a binary float matrix (.bin extension). 
Each column is a point, where the rows are in the following order: x, y, z, and intensity (little endian).
See the 3D Velodyne point clouds in [KITTI's dataset](http://www.cvlibs.net/datasets/kitti/raw_data.php) for example. 
