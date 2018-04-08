# lidar-annotator
Lidar annotation tool using ray tracing and bounding boxes.

![lidar-annotator](http://www.giphy.com/gifs/9JwTgZ0CDHK4jO2mf2)
# Usage
1. Clone the repository
2. To launch the app, just open index.html on your browser.
3. Load lidar data (see lidar format). 
4. To draw a bounding box, simply hold your mouse down and drag across the screen. See "Controls" section to learn more about user interface. 
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
