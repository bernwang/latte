# LiDAR-annotator
LiDAR annotation tool using ray tracing and bounding boxes.

Demo Video: [https://www.youtube.com/watch?v=Il5a1egqnUI](https://www.youtube.com/watch?v=Il5a1egqnUI&feature=youtu.be)

# For people using the annotator for the efficiency test
1. There are 10 frames (.bin files) in /test/velodyne_points/data. 
2. You can load multiple frames at once. Frames take between 2-8 minutes to annonate based now how many objects are in the scene. You should load a few frames at a time (~3-5), and doing them in batches, in the case of lost data. Data is exported only after all selected frames are annotated. Please note that if the page is refreshed or if the window is closed, all progress is lost. 
3. There is a record button so that you can pause the test if you want. Note that if you pause the test, you will be forced into "2D mode" and cannot draw boxes. Click on the button again to resume recording. Recording will be automatically paused when you move onto a new fram. 
4. To move onto the next frame, click "Next frame". You cannot go back to a previous frame.
5. Please look at the "controls" section to understand how to draw/edit bounding boxes. Read "my strategy for annotating" for a quickstart on annotating. In my opinion, this is the most efficient way to annotate with this current version for people who are new. 
6. After all frames in the batch are annotated, a JSON file will be exported. You can choose to name it whatever you want, as only the data stored is important. It is okay if the annotations are in several JSON files as annotating in batches is recommended. 
7. Thank you for participating in the efficiency test! Your time and effort goes into making the LiDAR annotater better!


# My strategy for annotating
1. Go into "draw" mode. Draw bounding boxes for all objects of interest (i.e. vehicles, pedestrians, cyclists). 
![Alt Text](https://github.com/bernwang/LiDAR-annotator/blob/evaluation/gifs/step1.gif)
2. Then, in "3D mode", for each row in the Object ID table, click on the object number, and its corresponding bounding box will turn blue. Then adjust the object id (car, van, truck, etc.) to what you think that object is. If the object is not an object of interest, just hit the delete or backspace key to delete the bounding box. 
3. If you miss any object of interest, go back to "draw" mode to draw a bounding box for it.
4. Repeat (1) through (3) until you think that all objects of interest are covered.

# Usage
1. Clone the repository
2. To launch the app, just open index.html on your browser.
3. Load LiDAR data (see LiDAR format). 
4. To draw a bounding box, simply hold your mouse down and drag across the screen. See "Controls" section to learn more about user interface. 
5. To *export* your bounding boxes, click on the "save" button to the top-left.

# Controls
## "3D" mode
1. Left click and drag to orbit around the point cloud
2. Right click and drag to translate.
3. You can label objects in "3D" mode (see "labelling bounding boxes")

## "2D/Draw" mode
(Note: While in "2D move" mode, hold the control key to be in "draw mode")
1. Click and drag to draw a bounding box and release to set it
2. To resize bounding box, click and drag the "corner" vertices
3. You can only click and drag on a corner vertex if it is blue. It will turn blue if your mouse is close enough to it. 
3. To rotate bounding box, click and drag the point that is not a corner vertex (it should be between two corner vertices) and box will rotate with the point. 
4. To "select" bounding box, first hover above it. You can tell it is hovered if it turns red. Then click somewhere strictly inside a bounding box, and the borders will turn blue. 
5. To delete bounding box, press the backspace/delete key while the bounding box is selected. 
6. When a bounding box is selected, the input for its corresponding row in the object ID table is focused. (see "labelling bounding boxes")

## Labelling Bounding Boxes
1. Click on the index of a bounding box in the "object id table" and its corresponding bounding box will change color to blue.
2. To change label, just change the value in the dropdown input, and the bounding box's object id will save automatically on input change
3. You can also delete a bounding box by selecting its corresponding row, and the bounding box should turn blue. Then press the delete or backspace key to delete the bounding box. Its corresponding table row should also be deleted. 

# LiDAR Format
This version of the app assumes the LiDAR data to be stored in a binary float matrix (.bin extension). 
Each column is a point, where the rows are in the following order: x, y, z, and intensity (little endian).
See the 3D Velodyne point clouds in [KITTI's dataset](http://www.cvlibs.net/datasets/kitti/raw_data.php) for example. 
