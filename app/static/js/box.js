function Box(anchor, cursor, angle, boundingBox, boxHelper, data) {
    this.id = id; // id (int) of Box
    this.object_id = 'car'; // object id (string)
    this.color = hover_color.clone(); // color of corner points
    this.angle = angle; // orientation of bounding box
    this.anchor = anchor; // point where bounding box was created
    this.cursor = cursor.clone(); // cursor
    this.added = false; // (boolean) whether the box has been added to boundingboxes
    this.boundingBox = boundingBox; // Box3; sets the size of the box
    this.boxHelper = boxHelper; // BoxHelper; helps visualize the box
    this.geometry = new THREE.Geometry(); // geometry for corner/rotating points

    // visualizes the corners (in the non-rotated coordinates) of the box
    this.points = new THREE.Points( this.geometry, pointMaterial );
    this.points.frustumCulled = false; // allows 

    
    this.colors = []; // colors of the corner points

    // add colors to points geometry
    for (var i = 0; i < 6; i++) {
        this.colors.push( this.color.clone().multiplyScalar( 7 ) );
    }
    this.geometry.colors = this.colors;
    
    // order of corners is max, min, topleft, bottomright
    this.geometry.vertices.push(anchor);
    this.geometry.vertices.push(cursor);
    this.geometry.vertices.push(anchor.clone());
    this.geometry.vertices.push(cursor.clone());
    this.geometry.vertices.push(getCenter(anchor.clone(), cursor.clone()));
    this.geometry.vertices.push(anchor.clone());  // place holder
    // this.geometry.vertices.push(anchor.clone());  // place holder

    var maxVector = this.geometry.vertices[0].clone();
    var minVector = this.geometry.vertices[1].clone();
    var topLeft = this.geometry.vertices[2].clone();
    var bottomRight = this.geometry.vertices[3].clone();
    var bottomCenter = this.geometry.vertices[4].clone();

    // height and centerZ
    [heightCar, centerZ] = getHeight(data,this.boundingBox);
    this.heightCar = heightCar;
    this.centerZ = centerZ;
    // var lowCenter = getCenter(anchor.clone(), cursor.clone());
    var highCenter = getCenter(anchor.clone(), cursor.clone());
    // lowCenter.add(new THREE.Vector3(0, (this.centerZ-this.heightCar/2),0));
    highCenter.add(new THREE.Vector3(0, (this.centerZ+this.heightCar/2),0));
    maxVector.add(new THREE.Vector3(0, (this.centerZ+this.heightCar/2),0));
    minVector.add(new THREE.Vector3(0, (this.centerZ+this.heightCar/2),0));
    topLeft.add(new THREE.Vector3(0, (this.centerZ+this.heightCar/2),0));
    bottomRight.add(new THREE.Vector3(0, (this.centerZ+this.heightCar/2),0));
    bottomCenter.add(new THREE.Vector3(0, (this.centerZ+this.heightCar/2),0));

    this.geometry.vertices[0] = maxVector.clone();
    this.geometry.vertices[1] = minVector.clone();
    this.geometry.vertices[2] = topLeft.clone();
    this.geometry.vertices[3] = bottomRight.clone();
    this.geometry.vertices[4] = bottomCenter.clone();
    // this.geometry.vertices[5] = lowCenter.clone();
    this.geometry.vertices[5] = highCenter.clone();
    console.log(this.geometry.vertices)

    this.hasPredictedLabel = false;

    this.get_center = function() {
        var center3D = getCenter(this.geometry.vertices[0], this.geometry.vertices[1]);
        return new THREE.Vector2(center3D.z, center3D.x);
    }
   
    // method for resizing bounding box given cursor coordinates
    // 
    // since BoxHelper3 draws a box in the same orientation as that of the point cloud, 
    // we take the anchor and cursor, rotate them by the angle of the camera, draw the box, 
    // then rotate the box back
    this.resize = function(cursor) {
        // checks and executes only if anchor does not overlap with cursor to avoid 0 determinant
        if (cursor.x != this.anchor.x && cursor.y != this.anchor.y && cursor.z != this.anchor.z) {

            var v1 = cursor.clone();
            var v2 = this.anchor.clone();

            v1.y = 0;
            v2.y = 0;
            
            // rotate cursor and anchor
            rotate(v1, v2, this.angle);

            // calculating corner points and rotating point
            var maxVector = getMax(v1, v2);
            var minVector = getMin(v1, v2);
            var topLeft = getTopLeft(v1, v2);
            var bottomRight = getBottomRight(v1, v2);
            var topCenter = getCenter(topLeft, maxVector);
            var bottomCenter = getCenter(minVector, bottomRight);
            
            [heightCar, centerZ] = getHeight(data,this.boundingBox);
            this.heightCar = heightCar;
            this.centerZ = centerZ;
            // var lowCenter = getCenter(maxVector.clone(), minVector.clone());
            var highCenter = getCenter(maxVector.clone(), minVector.clone());
            // lowCenter.add(new THREE.Vector3(0, (this.centerZ-this.heightCar/2),0));
            highCenter.add(new THREE.Vector3(0, (this.centerZ+this.heightCar/2),0));
            maxVector.add(new THREE.Vector3(0, (this.centerZ+this.heightCar/2),0));
            minVector.add(new THREE.Vector3(0, (this.centerZ+this.heightCar/2),0));
            topLeft.add(new THREE.Vector3(0, (this.centerZ+this.heightCar/2),0));
            bottomRight.add(new THREE.Vector3(0, (this.centerZ+this.heightCar/2),0));
            bottomCenter.add(new THREE.Vector3(0, (this.centerZ+this.heightCar/2),0));

            // need to do this to make matrix invertible
            maxVector.y += 0.00001;

            // setting bounding box limits
            this.boundingBox.set(minVector.clone(), maxVector.clone());

            // rotate BoxHelper back
            this.boxHelper.rotation.y = this.angle;

            // setting y coordinate back to zero since we are done with drawing
            // maxVector.y = 0;

            // rotate back the corner points
            rotate(minVector, maxVector, -this.angle);
            rotate(topLeft, bottomRight, -this.angle);
            rotate(topCenter, bottomCenter, -this.angle);

            // set updated corner points used to resize box
            this.geometry.vertices[0] = maxVector.clone();
            this.geometry.vertices[1] = minVector.clone();
            this.geometry.vertices[2] = topLeft.clone();
            this.geometry.vertices[3] = bottomRight.clone();
            this.geometry.vertices[4] = bottomCenter.clone();
            // this.geometry.vertices[5] = lowCenter.clone();
            this.geometry.vertices[5] = highCenter.clone();

            // tell scene to update corner points
            this.geometry.verticesNeedUpdate = true;
        }
    }

    // method to reheight the 3D bounding box manually, only under 3D mode
    this.reheight = function (mouse, originalVertices) {
        if (mouse.z != this.anchor.y) {
            console.log("this.angle",this.angle)

            // calculating corner points and rotating point
            console.log(originalVertices.vertices[0]);
            var maxVector = originalVertices.vertices[0].clone();
            maxVector.y = 0;
            var minVector = originalVertices.vertices[1].clone();
            minVector.y = 0;
            var topLeft = originalVertices.vertices[2].clone();
            topLeft.y = 0;
            var bottomRight = originalVertices.vertices[3].clone();
            bottomRight.y = 0;
            var topCenter = getCenter(maxVector, topLeft);
            var bottomCenter = originalVertices.vertices[4].clone();
            bottomCenter.y = 0;

            var bottom = this.centerZ - this.heightCar/2;
            var top = mouse.clone().z;
            this.heightCar = top-bottom;
            this.centerZ = (top+bottom)/2;
            // var lowCenter = getCenter(maxVector.clone(), minVector.clone());
            var highCenter = getCenter(maxVector.clone(), minVector.clone());
            // lowCenter.add(new THREE.Vector3(0, (this.centerZ-this.heightCar/2),0));
            highCenter.add(new THREE.Vector3(0, (this.centerZ+this.heightCar/2),0));
            maxVector.add(new THREE.Vector3(0, (this.centerZ+this.heightCar/2),0));
            minVector.add(new THREE.Vector3(0, (this.centerZ+this.heightCar/2),0));
            topLeft.add(new THREE.Vector3(0, (this.centerZ+this.heightCar/2),0));
            bottomRight.add(new THREE.Vector3(0, (this.centerZ+this.heightCar/2),0));
            bottomCenter.add(new THREE.Vector3(0, (this.centerZ+this.heightCar/2),0));

            // need to do this to make matrix invertible
            maxVector.y += 0.00001;

            // set updated corner points used to resize box
            this.geometry.vertices[0] = maxVector.clone();
            this.geometry.vertices[1] = minVector.clone();
            this.geometry.vertices[2] = topLeft.clone();
            this.geometry.vertices[3] = bottomRight.clone();
            this.geometry.vertices[4] = bottomCenter.clone();
            // this.geometry.vertices[5] = lowCenter.clone();
            this.geometry.vertices[5] = highCenter.clone();

            // rotate back the corner points
            rotate(minVector, maxVector, this.angle);
            rotate(topLeft, bottomRight, this.angle);
            rotate(topCenter, bottomCenter, this.angle);
            this.boxHelper.rotation.y = this.angle;

            // setting bounding box limits
            this.boundingBox.set(minVector.clone(), maxVector.clone());
            this.boundingBox.max.y = this.centerZ + this.heightCar/2;
            this.boundingBox.min.y = this.centerZ - this.heightCar/2;
            console.log("Boundingbox min",boundingBox.min);
            console.log("Boundingbox max",boundingBox.max);

            // rotate BoxHelper back
            this.boxHelper.rotation.y = this.angle;

            // tell scene to update corner points
            this.geometry.verticesNeedUpdate = true;
        }
    }

    // method to rotate bounding box by clicking and dragging rotate point, 
    // which is the top center point on the bounding box
    this.rotate = function(cursor) {
        // get corner points
        var maxVector = this.geometry.vertices[0].clone();
        maxVector.y = 0;
        var minVector = this.geometry.vertices[1].clone();
        minVector.y = 0;
        var topLeft = this.geometry.vertices[2].clone();
        topLeft.y = 0;
        var bottomRight = this.geometry.vertices[3].clone();
        bottomRight.y = 0;
        var topCenter = getCenter(maxVector, topLeft);
        var bottomCenter = this.geometry.vertices[4].clone();
        bottomCenter.y = 0;

        // get relative angle of cursor with respect to 
        var center = getCenter(maxVector, minVector);
        var angle = getAngle(center, bottomCenter, cursor, topCenter);
        
        [heightCar, centerZ] = getHeight(data,this.boundingBox);
        this.heightCar = heightCar;
        this.centerZ = centerZ;
        // var lowCenter = getCenter(maxVector.clone(), minVector.clone());
        var highCenter = getCenter(maxVector.clone(), minVector.clone());
        // lowCenter.add(new THREE.Vector3(0, (this.centerZ-this.heightCar/2),0));
        highCenter.add(new THREE.Vector3(0, (this.centerZ+this.heightCar/2),0));
        maxVector.add(new THREE.Vector3(0, (this.centerZ+this.heightCar/2),0));
        minVector.add(new THREE.Vector3(0, (this.centerZ+this.heightCar/2),0));
        topLeft.add(new THREE.Vector3(0, (this.centerZ+this.heightCar/2),0));
        bottomRight.add(new THREE.Vector3(0, (this.centerZ+this.heightCar/2),0));
        bottomCenter.add(new THREE.Vector3(0, (this.centerZ+this.heightCar/2),0));

        // update angle of Box and bounding box
        this.angle = this.angle + angle;
        this.boxHelper.rotation.y = this.angle;

        // rotate and update corner points
        rotate(minVector, maxVector, -angle);
        rotate(topLeft, bottomRight, -angle);
        rotate(topCenter, bottomCenter, -angle);

        this.geometry.vertices[0] = maxVector.clone();
        this.geometry.vertices[1] = minVector.clone();
        this.geometry.vertices[2] = topLeft.clone();
        this.geometry.vertices[3] = bottomRight.clone();
        this.geometry.vertices[4] = bottomCenter.clone();
        // this.geometry.vertices[5] = lowCenter.clone();
        this.geometry.vertices[5] = highCenter.clone();

        // tell scene to update corner points
        this.geometry.verticesNeedUpdate = true;
        
    }

    // method to translate bounding box given a reference point
    this.translate = function(v) {
        // get difference in x and z coordinates between cursor when 
        // box was selected and current cursor position
        var dx = v.x - this.cursor.x;
        var dz = v.z - this.cursor.z;

        // update all points related to box by dx and dz
        this.anchor.x += dx;
        this.anchor.z += dz;
        this.cursor = v.clone();
        for (var i = 0; i < this.geometry.vertices.length; i++) {
            var p = this.geometry.vertices[i];
            p.x += dx;
            p.z += dz;
        }

        // shift bounding box given new corner points
        var maxVector = this.geometry.vertices[0].clone();
        maxVector.y = 0;
        var minVector = this.geometry.vertices[1].clone();
        minVector.y = 0;
        var topLeft = this.geometry.vertices[2].clone();
        topLeft.y = 0;
        var bottomRight = this.geometry.vertices[3].clone();
        bottomRight.y = 0;
        var topCenter = getCenter(maxVector, topLeft);
        var bottomCenter = this.geometry.vertices[4].clone();
        bottomCenter.y = 0;

        rotate(maxVector, minVector, this.angle);
        rotate(topLeft, bottomRight, this.angle);
        rotate(topCenter, bottomCenter, this.angle);
        
        
        [heightCar, centerZ] = getHeight(data,this.boundingBox);
        this.heightCar = heightCar;
        this.centerZ = centerZ;
        // var lowCenter = getCenter(maxVector.clone(), minVector.clone());
        var highCenter = getCenter(maxVector.clone(), minVector.clone());
        // lowCenter.add(new THREE.Vector3(0, (this.centerZ-this.heightCar/2),0));
        highCenter.add(new THREE.Vector3(0, (this.centerZ+this.heightCar/2),0));
        maxVector.add(new THREE.Vector3(0, (this.centerZ+this.heightCar/2),0));
        minVector.add(new THREE.Vector3(0, (this.centerZ+this.heightCar/2),0));
        topLeft.add(new THREE.Vector3(0, (this.centerZ+this.heightCar/2),0));
        bottomRight.add(new THREE.Vector3(0, (this.centerZ+this.heightCar/2),0));
        bottomCenter.add(new THREE.Vector3(0, (this.centerZ+this.heightCar/2),0));
        this.geometry.vertices[0] = maxVector.clone();
        this.geometry.vertices[1] = minVector.clone();
        this.geometry.vertices[2] = topLeft.clone();
        this.geometry.vertices[3] = bottomRight.clone();
        this.geometry.vertices[4] = bottomCenter.clone();
        // this.geometry.vertices[5] = lowCenter.clone();
        this.geometry.vertices[5] = highCenter.clone();
        // need to do this to make matrix invertible
        maxVector.y += 0.00001;

        this.boundingBox.set(minVector, maxVector);

        // tell scene to update corner points
        this.geometry.verticesNeedUpdate = true;
    }

    // method to highlight box given cursor
    this.select = function(cursor) {
        selectedBox = this;
        if (this && cursor) {
            selectedBox.cursor = cursor;
        }
        updateHoverBoxes(cursor);
        // this.changeBoundingBoxColor(new THREE.Color( 0,0,7 ) );
        this.changeBoundingBoxColor(selected_color);
    }


    // changes and updates a box's point's color given point index and color
    this.changePointColor = function(idx, color) {
        this.colors[idx] = color;
        this.geometry.colorsNeedUpdate = true;
    }
    // method to change color of bounding box
    this.changeBoundingBoxColor = function(color) {
        var boxHelperCopy = new THREE.Box3Helper( this.boundingBox, color );
        scene.add(boxHelperCopy);
        scene.remove(this.boxHelper);
        this.boxHelper = boxHelperCopy;
        boxHelperCopy.rotation.y = this.angle;
    }

    this.output = function() {
        return new OutputBox(this);
    }

    this.get_cursor_distance_threshold = function() {
        return Math.min(distance2D(this.geometry.vertices[0], this.geometry.vertices[2]),
            distance2D(this.geometry.vertices[0], this.geometry.vertices[1])) / 4;
    }
}
    







// gets angle between v1 and v2 with respect to origin
//
// v3 is an optional reference point that should be v1's reflection about the origin, 
// but is needed to get the correct sign of the angle
function getAngle(origin, v1, v2, v3) {
    v1 = v1.clone();
    v2 = v2.clone();
    origin = origin.clone();
    v1.sub(origin);
    v2.sub(origin);
    v1.y = 0;
    v2.y = 0;
    v1.normalize();
    v2.normalize();

    var angle = Math.acos(Math.min(1.0, v1.dot(v2)));
    if (v3) {
        v3 = v3.clone();
        v3.sub(origin);

        // calculates distance between v1 and v2 when v1 is rotated by angle
        var temp1 = v1.clone();
        rotate(temp1, v3.clone(), angle);
        var d1 = distance2D(temp1, v2);

        // calculates distance between v1 and v2 when v1 is rotated by -angle
        var temp2 = v1.clone();
        rotate(temp2, v3.clone(), -angle);
        var d2 = distance2D(temp2, v2);
        


        // compares distances to determine sign of angle
        if (d2 > d1) {
            angle = -angle;
        }
    }

    return angle;
}


// highlights closest corner point that intersects with cursor
function highlightCorners() {
    // get closest intersection with cursor
    var intersection = intersectWithCorner();

    if (intersection) {
            // get closest point and its respective box
            var box = intersection[0];
            var p = intersection[1];

            // get index of closest point
            var closestIdx = closestPoint(p, box.geometry.vertices);

            // if there was a previously hovered box, change its color back to red
            if (hoverBox) {
                // hoverBox.changePointColor(hoverIdx, new THREE.Color(7, 0, 0));
                hoverBox.changePointColor(hoverIdx, hover_color.clone());
            }

            // update hover box
            hoverBox = box;
            hoverIdx = closestIdx;
            // hoverBox.changePointColor(hoverIdx, new THREE.Color(0, 0, 7));
            hoverBox.changePointColor(hoverIdx, selected_color.clone());

    } else {

        // change color of previously hovered box back to red
        if (hoverBox) {
            // hoverBox.changePointColor(hoverIdx, new THREE.Color(7, 0, 0));
            hoverBox.changePointColor(hoverIdx, hover_color.clone());
        }

        // set hover box to null since there is no intersection
        hoverBox = null;
    }
}


// get height and z-center
function getHeight(data, boundingBox) {
    var zs = [];
    var xs = [];
    var ys = [];
    var stride = 4;
    var x_point = 0;
    var y_point = 0;
    var l = data.length/4;
    var boxMaxVector = new THREE.Vector2(boundingBox.max.x, boundingBox.max.z);
    var boxMinVector = new THREE.Vector2(boundingBox.min.x, boundingBox.min.z);
    // console.log(boxMaxVector);
    var box2D = new THREE.Box2(boxMinVector, boxMaxVector);
    for ( var i = 0; i < l; i ++ ) {
        x_point = data[ stride * i ];
        y_point = data[ stride * i + 1];
        if (box2D.distanceToPoint( new THREE.Vector2(y_point, x_point)) == 0 ) {
            zs.push(data[ stride * i + 2]);
            xs.push(data[ stride * i]);
            ys.push(data[ stride * i + 1]);
        }
    }
    // for debuging
    // console.log(boundingBox);
    // console.log(zs);
    // console.log(getMaxElement(xs));
    // console.log(getMinElement(xs));
    // console.log(getMaxElement(ys));
    // console.log(getMinElement(ys));

    min = getMinElement(zs);
    max = getMaxElement(zs);
    var heightCar = max-min;
    return [max-min, (max+min)/2];
}

// method to add box to boundingBoxes and object id table
function addBox(box) {
    boundingBoxes.push(box);
    id++;
    addRow(box);
}

function stringifyBoundingBoxes(boundingBoxes) {
    var outputBoxes = [];
    for (var i = 0; i < boundingBoxes.length; i++) {
        outputBoxes.push(new OutputBox(boundingBoxes[i]));
    }
    console.log(outputBoxes);
    return outputBoxes;
}


function OutputBox(box) {
    var v1 = box.geometry.vertices[0];
    var v2 = box.geometry.vertices[1];
    var v3 = box.geometry.vertices[2];
    var center = getCenter(v1, v2);
    this.center = new THREE.Vector3(center.z, center.x, box.centerZ);
    // console.log("center: ", this.center);
    this.width = distance2D(v2, v3);
    this.length = distance2D(v1, v3);
    this.height = box.heightCar;
    this.angle = box.angle;
    this.object_id = box.object_id;
}