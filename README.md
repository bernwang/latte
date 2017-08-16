![antsy3d](https://user-images.githubusercontent.com/2068077/29349796-892f14bc-8210-11e7-876f-5864c61cfc99.gif)

# Antsy 3D
Lightweight point cloud annotation tool for instance-level segmentation using fat markers and raytracing.

> Sorry, current version using skinny (1-pixel) marker. :( Another option is to use Three.js's built-in octotree and color entire boxes.

# Usage

**No installation needed!** This is an in-browser interactive view of your models.

1. To *run*, double-click on `index.html` to launch the app.
2. To *label*, simply hold your mouse down and drag across the screen.
3. To *export* your labelled points, click on the "save" button to the top-left.

Need to rotate or move your point cloud? To change between `move mode` and `label mode`, click on the respective buttons in the top-left:
- In `move mode,` dragging will reorient the point cloud. Scrolling with zoom in and out.
- In `label mode,` dragging will added red dots, representing labelled points.

# Point Cloud Format

`js/output.js` defines a global variable `data`, a dictionary mapping unique point cloud names to point cloud data; point clouds have a `vertices` property, a list of vertices, each with `.x`, `.y` and `.z` properties.

e.g., To access the `x` position of the first point in the point cloud named `frog`, you would access `data.frog.vertices[0].x`. Simple example of `output.js`:

```
var data = {
   'frog': {
      'vertices': [
          {'x': 3.5, 'y': 3.5, 'z': 5.6},
          {'x': 1.0, 'y': 1.2, 'z': 3.4}
      ]
   }
}
```
