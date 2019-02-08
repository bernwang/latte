# 3D LiDAR Annotator
## forked from bernwang/LiDAR-annotator
![](annotation_presentation.gif)

# Usage
1. Clone the repository
2. To launch the app, use python to run the app.py in app/ folder.
3. Load LiDAR data (see LiDAR format). 
4. To draw a bounding box, starting recording first and then simply hold mouse down and drag across the screen with your ctrl down. See "Controls" section to learn more about user interface. 
5. To *export* your bounding boxes, click on the "save" button to the top-left.

# Controls
## "3D" mode
1. Left click and drag to orbit around the point cloud
2. Right click and drag to translate.
3. You can label objects in "3D" mode (see "labelling bounding boxes")
4. You can also adjust the height of the 3D bounding box with ctrl down and click and drag the center point. 

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
