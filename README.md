# LiDAR-annotator
Lidar annotation tool using ray tracing and bounding boxes.

# For people using the annotator for the efficiency test
1. There are 10 frames (.bin files) in /test/velodyne_points/data. It is preferable that all 10 frames are annotated, but 
2. You can load multiple frames at once. Frames take between 2-8 minutes to annonate based now how many objects are in the scene. I highly encourage loading a few frames at a time (~3-5), and doing them in batches, because data collected is exported after all selected frames are annotated. Please note that if the page is refreshed or if the window is closed, all progress is lost. 
3. There is a record button so that you can pause the test if you want. Note that if you pause the test, you will be forced into "2D mode" and cannot draw boxes. Click on the button again to resume recording. Recording will be automatically paused when you move onto a new fram. 
4. To move onto the next frame, click "Next frame". You cannot go back to a previous frame.
5. Please look at the "controls" section to understand how to draw/edit bounding boxes. If you want a quickstart on annotating, please read "my strategy for annotating"
6. After all frames in the batch are annotated, a JSON file will be exported. You can choose to name it whatever you want, as only the data stored is important. It is okay if the annotations are in several JSON files as annotating in batches is recommended. 
7. Thank you for participating in the efficiency test! Your time and effort goes into making the LiDAR annotater better!


# My strategy for annotating



# Usage
1. Clone the repository
2. To launch the app, just open index.html on your browser.
3. Load lidar data (see lidar format). 
4. To draw a bounding box, simply hold the "control" key down and click and drag. See "Controls" section to learn more about user interface. 
5. To *export* your bounding boxes, click on the "save" button to the top-left.

# Controls
## "2D/3D move" mode
1. Left click and drag to orbit around the point cloud
2. Right click and drag to translate. 
## "Draw" mode
(Note: While in "2D move" mode, hold the control key to be in "draw mode")
1. Click and drag to draw a bounding box and release to set it
2. To resize bounding box, click and drag the "corner" vertices
3. To rotate bounding box, click and drag the point in between two of the vertices and box will rotate with the point
4. To "select" bounding box, click somewhere strictly inside a bounding box, and the borders will turn blue
5. To delete bounding box, press the backspace/delete key while the bounding box is selected
6. When a bounding box is selected, the input for its corresponding row in the labels table is focused.
## "Label" mode
1. Click on an input in the "label table" and its corresponding bounding box will change color to blue.
2. To change label, just change the value in the input, and the bounding box's object id will save automatically on input change

# Lidar Format
This version of the app assumes the lidar data to be stored in a binary float matrix (.bin extension). 
Each column is a point, where the rows are in the following order: x, y, z, and intensity (little endian).
See the 3D Velodyne point clouds in [KITTI's dataset](http://www.cvlibs.net/datasets/kitti/raw_data.php) for example. 
