function normalizeColors(vertices, color) {
    var maxColor = Number.NEGATIVE_INFINITY;
    var minColor = Number.POSITIVE_INFINITY;
    intensities = [];
    normalizedIntensities = [];
    colors = [];

    k = 0;
    var stride = 4;
    console.log("vertices length: ", vertices.length);
    // finds max and min z coordinates
    for ( var i = 0, l = vertices.length / 4; i < l; i ++ ) {
        
        if (vertices[ stride * k + 2] > maxColor) {
            maxColor = vertices[ stride * k + 2];
        }
        if (vertices[ stride * k + 2] < minColor) {
            minColor = vertices[ stride * k + 2];
        }
        intensities.push(vertices[ stride * k + 2]);
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
    for ( var i = 0;  i < intensities.length; i ++ ) {
        var intensity = intensities[i];
        if (intensities[i] - mean >= 2 * sd) {
            intensity = 1;
        } else if (mean - intensities[i] >= 2 * sd) {
            intensity = 0;
        } else {
            intensity = (intensities[i] - min) / (max - min);
        }
        // colors[i] = ( color.clone().multiplyScalar( intensity * 2 ) );
        normalizedIntensities.push(intensities[i]);
        colors[i] = ( new THREE.Color( intensity, 0, 1 - intensity).multiplyScalar(intensity * 5));
        // colors[i] = color.clone();
        // if (colors[i].b > colors[i].r) {
        //     colors[i] = colors[i].multiplyScalar(0);
        // }
    }
    return colors;
}

function highlightPoints(indices) {
    // var colors = []
    // for (var i = 0; i < pointcloud.geometry.colors.length; i++) {
    //     colors.push(pointcloud.geometry.colors[i].clone());
    // }
    for (var j = 0; j < indices.length; j++) {
        pointcloud.geometry.colors[indices[j]] = new THREE.Color( 0,1,0 );
    }
    // pointcloud.geometry.colors = colors;
    console.log(indices.length);
    // console.log(colors);
    pointcloud.geometry.colorsNeedUpdate = true;

}

function generatePointCloud( vertices, color ) {

    var geometry = new THREE.Geometry();
    var colors = [];
    var k = 0;
    var stride = 4;
    for ( var i = 0, l = vertices.length / 4; i < l; i ++ ) {
        // creates new vector from a cluster and adds to geometry
        var v = new THREE.Vector3( vertices[ stride * k + 1 ], 
            vertices[ stride * k + 2 ], vertices[ stride * k ] );

        // stores y coordinates into yCoords
        yCoords.push(vertices[ stride * k + 2 ]);
        
        // add vertex to geometry
        geometry.vertices.push( v );
        colors.push(color.clone());
        k++;
    }
    console.log("size: ", geometry.vertices.length);
    geometry.colors = normalizeColors(vertices, color);
    // geometry.colors = colors;
    geometry.computeBoundingBox();

    var material = new THREE.PointsMaterial( { size: pointSize, sizeAttenuation: false, vertexColors: THREE.VertexColors } );
    // creates pointcloud given vectors
    var pointcloud = new THREE.Points( geometry, material );

    return pointcloud;

}