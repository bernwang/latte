function normalizeColors(vertices, color) {
    var maxColor = Number.NEGATIVE_INFINITY;
    var minColor = Number.POSITIVE_INFINITY;
    var intensities = [];
    var normalizedIntensities = [];
    var colors = app.cur_pointcloud.geometry.colors;
    k = 0;
    var stride = 4;
    // finds max and min z coordinates
    for ( var i = 0, l = vertices.length / DATA_STRIDE; i < l; i ++ ) {
        if (vertices[ DATA_STRIDE * k + 2] > maxColor) {
            maxColor = vertices[ DATA_STRIDE * k + 2];
        }
        if (vertices[ DATA_STRIDE * k + 2] < minColor) {
            minColor = vertices[ DATA_STRIDE * k + 2];
        }
        intensities.push(vertices[ DATA_STRIDE * k + 2]);
        k++;
    }

    mean = calculateMean(intensities);
    sd = standardDeviation(intensities);
    filteredIntensities = filter(intensities, mean, 1 * sd);
    min = getMinElement(filteredIntensities);
    max = getMaxElement(filteredIntensities);
    // normalize colors
    // if greater than 2 sd from mean, set to max color
    // if less than 2 sd from mean, set to min color
    // ortherwise normalize color based on min and max z-coordinates
    var intensity;
    for ( var i = 0;  i < app.cur_pointcloud.geometry.vertices.length; i ++ ) {
        intensity = intensities[i];
        if (i < intensities.length) {
            if (intensities[i] - mean >= 2 * sd) {
                intensity = 1;
            } else if (mean - intensities[i] >= 2 * sd) {
                intensity = 0;
            } else {
                intensity = (intensities[i] - min) / (max - min);
            }
        } else {
            intensity = 0;
        }
        colors[i].setRGB(intensity, 0, 1 - intensity);
        colors[i].multiplyScalar(intensity * 5);    
        app.cur_pointcloud.geometry.colorsNeedUpdate = true;
    }
    
    return colors;
}

function highlightPoints(indices) {
    var pointcloud = app.cur_pointcloud;
    for (var j = 0; j < indices.length; j++) {
        pointcloud.geometry.colors[indices[j]] = new THREE.Color(0x00ff6b);
    }
    pointcloud.geometry.colorsNeedUpdate = true;

}

function generateNewPointCloud( vertices, color ) {
    var geometry = new THREE.Geometry();
    var colors = [];
    var k = 0;
    for ( var i = 0, l = vertices.length / DATA_STRIDE; i < l; i ++ ) {
        // creates new vector from a cluster and adds to geometry
        var v = new THREE.Vector3( vertices[ DATA_STRIDE * k + 1 ], 
            vertices[ DATA_STRIDE * k + 2 ], vertices[ DATA_STRIDE * k ] );

        // stores y coordinates into yCoords
        // app.cur_frame.ys.push(vertices[ DATA_STRIDE * k + 2 ]);
        
        // add vertex to geometry
        geometry.vertices.push( v );
        colors.push(color.clone());
        k++;
    }
    geometry.colors = colors;
    // geometry.colors = colors;
    geometry.computeBoundingBox();

    var material = new THREE.PointsMaterial( { size: pointSize, sizeAttenuation: false, vertexColors: THREE.VertexColors } );
    // creates pointcloud given vectors
    var pointcloud = new THREE.Points( geometry, material );
    app.cur_pointcloud = pointcloud;
    normalizeColors(vertices, color);
    return pointcloud;
}

function updatePointCloud( vertices, color ) {
    var k = 0;
    var n = vertices.length;
    var l = app.cur_pointcloud.geometry.vertices.length;
    var geometry = app.cur_pointcloud.geometry
    var v;
    for ( var i = 0; i < n / DATA_STRIDE; i ++ ) {
        if (i >= l) {
            v = new THREE.Vector3( vertices[ DATA_STRIDE * k + 1 ], 
                app.cur_frame.ys[k], vertices[ DATA_STRIDE * k ] );
            geometry.vertices.push(v);
            geometry.colors.push(color.clone());

            // stores y coordinates into yCoords
            // app.cur_frame.ys.push(vertices[ DATA_STRIDE * k + 2 ]);
            geometry.verticesNeedUpdate = true;
            geometry.colorsNeedUpdate = true;
        } else {
            v = geometry.vertices[k];
            v.setX(vertices[ DATA_STRIDE * k + 1 ]);
            v.setY(app.cur_frame.ys[k]);
            v.setZ(vertices[ DATA_STRIDE * k ]);
            geometry.verticesNeedUpdate = true;
        }
        k++;
    }
    normalizeColors(vertices, null);
    geometry.computeBoundingBox();
    console.log("fii");
    if (app.cur_frame != null && app.cur_frame.mask_rcnn_indices.length > 0) {
        highlightPoints(app.cur_frame.mask_rcnn_indices);
    }

    return app.cur_pointcloud;

}