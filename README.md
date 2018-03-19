# lidar-annotator
Lidar annotation tool for instance-level segmentation using ray tracing and bounding boxes.

# Usage
1. Clone the repository
2. To launch the app, just open index.html on your browser.
3. Load lidar data (see lidar format). 
4. To draw a bounding box, simply hold your mouse down and drag across the screen.
5. To *export* your bounding boxes, click on the "save" button to the top-left.

# Lidar Format
This version of the app assumes the lidar data to be stored in a binary float matrix (.bin extension). 
Each column is a point, where the rows are in the following order: x, y, z, and intensity (little endian).
