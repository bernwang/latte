import xml.etree.ElementTree as ET


e = ET.parse('/Users/berniewang/annotator/lidarAnnotator/test/' \
								'velodyne_points/tracklet_labels/' \
								'tracklet_labels_13.xml').getroot()

for child in e:
	print(child.tag, child.attrib)