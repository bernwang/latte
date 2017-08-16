# Antsy 3D
Lightweight point cloud annotation tool for instance-level segmentation using fat markers and raytracing.

> Sorry, current version using skinny (1-pixel) marker. :( Another option is to use Three.js's built-in octotree and color entire boxes.

This is an in-browser interactive view of your models. To run, use the following
from the root of this repository. Navigate to the repository root. Double-click on `index.html` to launch the app. No installation is required.

# Point Cloud Format

`js/output.js` defines a global variable `data`, a dictionary mapping unique point cloud names to point cloud data; point clouds have a `vertices` property, a list of vertices, each with `.x`, `.y` and `.z` properties.

e.g., To access the `x` position of the first point in the point cloud named `frog`, you would access `data.frog.vertices[0].x`.